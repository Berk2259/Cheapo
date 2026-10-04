import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import { PortalPremiumPreview } from "@/components/portal-premium-preview";
import {
  PortalCompare,
  type CompareGroup,
  type CompareRow,
  type SoloProduct,
} from "@/components/portal-compare";

type Source = { name: string } | { name: string }[] | null;

type ProductRow = {
  id: number;
  name: string;
  url: string;
  current_price: number | null;
  currency: string;
  last_checked_at: string | null;
  comparison_group: string | null;
  sources: Source;
  categories: Source;
};

const productSelect =
  "id, name, url, current_price, currency, last_checked_at, comparison_group, sources(name), categories(name)";

function sourceName(value: Source): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0]?.name ?? "") : value.name;
}

export default async function ComparePage() {
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
    return <PortalPremiumPreview kind="compare" premium={false} />;
  }

  // Müşterinin takip ettiği ürünler.
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

  const followedIds = new Set(followed.map((p) => p.id));
  const groupKeys = [
    ...new Set(
      followed.map((p) => p.comparison_group).filter((g): g is string => !!g),
    ),
  ];

  // Aynı gruptaki tüm aktif ürünler (alternatifler).
  const { data: groupData } =
    groupKeys.length > 0
      ? await supabase
          .from("products")
          .select(productSelect)
          .in("comparison_group", groupKeys)
          .eq("is_active", true)
      : { data: [] as ProductRow[] };

  const inGroups = (groupData ?? []) as ProductRow[];

  const toRow = (p: ProductRow): CompareRow => ({
    id: p.id,
    name: p.name,
    source: sourceName(p.sources),
    price: p.current_price !== null ? Number(p.current_price) : null,
    currency: p.currency,
    url: p.url,
    lastChecked: timeAgo(p.last_checked_at),
    mine: followedIds.has(p.id),
  });

  // Takip edilen ürün aktif değilse de kendi grubunda görünsün.
  const groups: CompareGroup[] = groupKeys.map((key) => {
    const rows = new Map<number, ProductRow>();
    for (const p of inGroups) if (p.comparison_group === key) rows.set(p.id, p);
    for (const p of followed) if (p.comparison_group === key) rows.set(p.id, p);
    const rowList = [...rows.values()];
    return {
      key,
      category: sourceName(rowList[0]?.categories ?? null),
      rows: rowList.map(toRow),
    };
  });

  // Yalnızca kendisi olan (alternatifi bulunmayan) gruplar ve grupsuz ürünler.
  const compared = groups.filter((g) => g.rows.length >= 2);
  const solo: SoloProduct[] = [
    ...followed.filter((p) => !p.comparison_group),
    ...groups
      .filter((g) => g.rows.length < 2)
      .flatMap((g) => followed.filter((p) => p.comparison_group === g.key)),
  ].map((p) => ({ id: p.id, name: p.name, source: sourceName(p.sources) }));

  const lastIso =
    inGroups
      .map((p) => p.last_checked_at)
      .filter((v): v is string => !!v)
      .sort()
      .at(-1) ?? null;

  return (
    <PortalCompare
      groups={compared}
      solo={solo}
      lastUpdated={timeAgo(lastIso)}
    />
  );
}