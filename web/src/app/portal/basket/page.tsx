import { createClient } from "@/lib/supabase/server";
import { PortalPremiumPreview } from "@/components/portal-premium-preview";
import {
  PortalBasket,
  type BasketCandidate,
  type BasketGroup,
  type BasketList,
} from "@/components/portal-basket";

type Source = { name: string } | { name: string }[] | null;
type Category = { name: string } | { name: string }[] | null;
type MatchName = { name: string } | { name: string }[] | null;

type ProductRow = {
  id: number;
  name: string;
  current_price: number | null;
  currency: string;
  comparison_group: string | null;
  category_id: number;
  sources: Source;
  categories: Category;
};

const productSelect =
  "id, name, current_price, currency, comparison_group, category_id, sources(name), categories(name)";

function sourceName(value: Source): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0]?.name ?? "") : value.name;
}

function categoryName(value: Category): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0]?.name ?? "") : value.name;
}

export default async function BasketPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>;
}) {
  const { list: listParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, plan")
    .eq("auth_user_id", user?.id ?? "")
    .maybeSingle();

  if (!customer || customer.plan !== "premium") {
    return <PortalPremiumPreview kind="basket" premium={false} />;
  }

  // Bu müşterinin sektöre göre seçebileceği kategoriler (sepet oluştururken).
  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });
  const categories = categoryRows ?? [];

  // Müşterinin tüm sepetleri.
  const { data: listRows } = await supabase
    .from("basket_lists")
    .select("id, name, category_id, categories(name)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: true });

  const allLists = (listRows ?? []) as {
    id: number;
    name: string;
    category_id: number | null;
    categories: Category;
  }[];

  // Müşterinin takip ettiği tüm ürünler (sepete eklenebilecek adaylar için).
  const { data: subData } = await supabase
    .from("subscriptions")
    .select(`product_id, products(${productSelect})`)
    .eq("customer_id", customer.id);

  const followed = ((subData ?? []) as {
    product_id: number;
    products: ProductRow | ProductRow[] | null;
  }[])
    .map((s) => (Array.isArray(s.products) ? s.products[0] : s.products))
    .filter((p): p is ProductRow => !!p);

  // Müşterinin tüm sepetlerindeki tüm ürünler (her sepetin ürün sayısını göstermek için).
  const { data: allBasketData } = await supabase
    .from("basket_items")
    .select(`list_id, product_id, added_at, match_id, basket_matches(name), products(${productSelect})`)
    .eq("customer_id", customer.id)
    .order("added_at", { ascending: true });

  const allBasketRows = (allBasketData ?? []) as {
    list_id: number;
    product_id: number;
    match_id: number | null;
    basket_matches: MatchName;
    products: ProductRow | ProductRow[] | null;
  }[];

  const lists: BasketList[] = allLists.map((l) => ({
    id: l.id,
    name: l.name,
    categoryId: l.category_id,
    categoryName: categoryName(l.categories),
    itemCount: allBasketRows.filter((b) => b.list_id === l.id).length,
  }));

  // Aktif sepet: URL'deki ?list= varsa ve müşteriye aitse o, yoksa ilk sepet.
  const parsedListId = listParam ? Number(listParam) : NaN;
  const activeList =
    lists.find((l) => l.id === parsedListId) ?? lists[0] ?? null;

  let groups: BasketGroup[] = [];
  let candidates: BasketCandidate[] = [];

  if (activeList) {
    const basketEntries = allBasketRows
      .filter((b) => b.list_id === activeList.id)
      .map((b) => {
        const product = Array.isArray(b.products) ? b.products[0] : b.products;
        if (!product) return null;
        const matchField = b.basket_matches;
        const matchName = Array.isArray(matchField)
          ? (matchField[0]?.name ?? null)
          : (matchField?.name ?? null);
        return { product, matchId: b.match_id, matchName };
      })
      .filter((e): e is { product: ProductRow; matchId: number | null; matchName: string | null } => !!e);

    const basketProducts = basketEntries.map((e) => e.product);
    const groupKeys = [
      ...new Set(
        basketProducts.map((p) => p.comparison_group).filter((g): g is string => !!g),
      ),
    ];

    const { data: groupData } =
      groupKeys.length > 0
        ? await supabase
            .from("products")
            .select(productSelect)
            .in("comparison_group", groupKeys)
            .eq("is_active", true)
        : { data: [] as ProductRow[] };

    const inGroups = (groupData ?? []) as ProductRow[];

    const rawGroups = basketEntries.map((entry) => {
      const item = entry.product;
      const siblings = item.comparison_group
        ? inGroups.filter((p) => p.comparison_group === item.comparison_group)
        : [];
      const rowsMap = new Map<number, ProductRow>();
      rowsMap.set(item.id, item);
      for (const p of siblings) rowsMap.set(p.id, p);
      return {
        key: String(item.id),
        matchId: entry.matchId,
        matchName: entry.matchName,
        primaryName: item.name,
        rows: [...rowsMap.values()].map((p) => ({
          source: sourceName(p.sources),
          price: p.current_price !== null ? Number(p.current_price) : null,
          currency: p.currency,
          name: p.name,
        })),
      };
    });

    const merged = new Map<string, BasketGroup>();
    for (const g of rawGroups) {
      if (g.matchId !== null) {
        const key = `match-${g.matchId}`;
        const existing = merged.get(key);
        if (existing) {
          existing.rows.push(...g.rows);
        } else {
          merged.set(key, {
            key,
            name: g.matchName ?? "Eşleştirilmiş ürünler",
            manual: true,
            matchId: g.matchId,
            rows: [...g.rows],
          });
        }
      } else {
        merged.set(g.key, {
          key: g.key,
          name: g.primaryName,
          manual: false,
          matchId: null,
          rows: g.rows,
        });
      }
    }
    groups = [...merged.values()];

    // Ekleme panelinde önerilecek ürünler: bu sepetin sektörüyle aynı
    // kategoride olan ve henüz aynı grup/ürün olarak sepette yer almayanlar.
    const usedGroups = new Set(
      basketProducts.map((p) => p.comparison_group).filter((g): g is string => !!g),
    );
    const usedSingleIds = new Set(
      basketProducts.filter((p) => !p.comparison_group).map((p) => p.id),
    );

    const eligible = followed.filter(
      (p) =>
        p.category_id === activeList.categoryId &&
        (p.comparison_group ? !usedGroups.has(p.comparison_group) : !usedSingleIds.has(p.id)),
    );

    const byGroupKey = new Map<string, ProductRow[]>();
    for (const p of eligible) {
      const key = p.comparison_group ?? `single-${p.id}`;
      const list = byGroupKey.get(key) ?? [];
      list.push(p);
      byGroupKey.set(key, list);
    }

    candidates = [...byGroupKey.values()].map((list) => {
      const priced = list.filter((p) => p.current_price !== null);
      const representative =
        priced.length > 0
          ? priced.reduce((a, b) =>
              (b.current_price as number) < (a.current_price as number) ? b : a,
            )
          : list[0];
      return {
        id: representative.id,
        name: representative.name,
        source: sourceName(representative.sources),
        price: representative.current_price !== null ? Number(representative.current_price) : null,
        currency: representative.currency,
        rows: list.map((p) => ({
          source: sourceName(p.sources),
          price: p.current_price !== null ? Number(p.current_price) : null,
          currency: p.currency,
        })),
      };
    });
  }

  return (
    <PortalBasket
      lists={lists}
      activeListId={activeList?.id ?? null}
      groups={groups}
      candidates={candidates}
      categories={categories}
    />
  );
}