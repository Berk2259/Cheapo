import { createClient } from "@/lib/supabase/server";
import { PortalPremiumPreview } from "@/components/portal-premium-preview";
import {
    PortalBasket,
    type BasketCandidate,
    type BasketGroup,
} from "@/components/portal-basket";

type Source = { name: string } | { name: string }[] | null;
type Category = { name: string } | { name: string }[] | null;

type ProductRow = {
    id: number;
    name: string;
    current_price: number | null;
    currency: string;
    comparison_group: string | null;
    sources: Source;
    categories: Category;
};

const productSelect =
    "id, name, current_price, currency, comparison_group, sources(name), categories(name)";

function sourceName(value: Source): string {
    if (!value) return "";
    return Array.isArray(value) ? (value[0]?.name ?? "") : value.name;
}

function categoryName(value: Category): string {
    if (!value) return "";
    return Array.isArray(value) ? (value[0]?.name ?? "") : value.name;
}

export default async function BasketPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: customer } = await supabase
        .from("customers")
        .select("id, plan")
        .eq("auth_user_id", user?.id ?? "")
        .maybeSingle();

    // Ücretsiz müşteri kilitli önizlemeyi görür.
    if (!customer || customer.plan !== "premium") {
        return <PortalPremiumPreview kind="basket" premium={false} />;
    }

    // Müşterinin takip ettiği market ürünleri (ekleme paneli için aday liste).
    const { data: subData } = await supabase
        .from("subscriptions")
        .select(`product_id, products(${productSelect})`)
        .eq("customer_id", customer.id);

    const followed = ((subData ?? []) as {
        product_id: number;
        products: ProductRow | ProductRow[] | null;
    }[])
        .map((s) => (Array.isArray(s.products) ? s.products[0] : s.products))
        .filter((p): p is ProductRow => !!p)
        .filter((p) => categoryName(p.categories) === "Market");

    // Müşterinin alışveriş listesine eklediği ürünler.
    const { data: basketData } = await supabase
        .from("basket_items")
        .select(`product_id, added_at, match_id, basket_matches(name), products(${productSelect})`)
        .eq("customer_id", customer.id)
        .order("added_at", { ascending: true });

    type MatchName = { name: string } | { name: string }[] | null;

    const basketEntries = ((basketData ?? []) as {
        product_id: number;
        match_id: number | null;
        basket_matches: MatchName;
        products: ProductRow | ProductRow[] | null;
    }[])
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

    // Sepetteki ürünlerin bağlı olduğu karşılaştırma grupları (diğer marketleri bulmak için).
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
        const rows = new Map<number, ProductRow>();
        rows.set(item.id, item);
        for (const p of siblings) rows.set(p.id, p);
        return {
            key: String(item.id),
            matchId: entry.matchId,
            matchName: entry.matchName,
            primaryName: item.name,
            rows: [...rows.values()].map((p) => ({
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

    const groups: BasketGroup[] = [...merged.values()];

    // Ekleme panelinde önerilecek ürünler: sepette henüz aynı grup/ürün olarak yer almayanlar.
    const usedGroups = new Set(
        basketProducts.map((p) => p.comparison_group).filter((g): g is string => !!g),
    );
    const usedSingleIds = new Set(
        basketProducts.filter((p) => !p.comparison_group).map((p) => p.id),
    );

    const eligible = followed.filter((p) =>
        p.comparison_group ? !usedGroups.has(p.comparison_group) : !usedSingleIds.has(p.id),
    );

    // Aynı karşılaştırma grubundan birden fazla ürün takip ediliyorsa panelde
    // tek satır göster (hangisi eklenirse eklensin diğer marketler otomatik gelir).
    const byGroupKey = new Map<string, ProductRow[]>();
    for (const p of eligible) {
        const key = p.comparison_group ?? `single-${p.id}`;
        const list = byGroupKey.get(key) ?? [];
        list.push(p);
        byGroupKey.set(key, list);
    }

    const candidates: BasketCandidate[] = [...byGroupKey.values()].map((list) => {
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

    return <PortalBasket groups={groups} candidates={candidates} />;
}