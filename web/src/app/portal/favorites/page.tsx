import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import type { PortalProduct } from "@/components/portal-product-card";
import { PortalProductsList } from "@/components/portal-products-list";

type Product = {
  id: number;
  name: string;
  url: string;
  current_price: number | null;
  currency: string;
  last_checked_at: string | null;
  category_id: number;
  categories: { name: string } | { name: string }[] | null;
  sources: { name: string } | { name: string }[] | null;
};
type Subscription = {
  id: number;
  target_price: number | null;
  notify_on_any_change: boolean;
  is_favorite: boolean;
  products: Product | Product[] | null;
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .maybeSingle();

  if (!customer) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select(
      "id, target_price, notify_on_any_change, is_favorite, products(id, name, url, current_price, currency, last_checked_at, category_id, categories(name), sources(name))",
    )
    .eq("customer_id", customer.id)
    .eq("is_favorite", true);

  const subs = ((data ?? []) as Subscription[])
    .map((s) => ({
      sub: s,
      product: Array.isArray(s.products) ? s.products[0] : s.products,
    }))
    .filter(
      (row): row is { sub: Subscription; product: Product } => !!row.product,
    );

  const productIds = subs.map((r) => r.product.id);
  const history =
    productIds.length > 0
      ? await supabase
        .from("price_history")
        .select("product_id, price, checked_at")
        .in("product_id", productIds)
        .order("checked_at", { ascending: false })
        .limit(300)
      : { data: [] as { product_id: number; price: number }[] };

  const seriesMap = new Map<number, number[]>();
  for (const row of history.data ?? []) {
    const list = seriesMap.get(row.product_id) ?? [];
    if (list.length < 24) list.push(Number(row.price));
    seriesMap.set(row.product_id, list);
  }

  const items: PortalProduct[] = subs.map(({ sub, product }) => ({
    id: product.id,
    subscriptionId: sub.id,
    name: product.name,
    category: Array.isArray(product.categories)
      ? (product.categories[0]?.name ?? "")
      : (product.categories?.name ?? ""),
    source: Array.isArray(product.sources)
      ? (product.sources[0]?.name ?? "")
      : (product.sources?.name ?? ""),
    url: product.url,
    currentPrice:
      product.current_price !== null ? Number(product.current_price) : null,
    currency: product.currency,
    lastChecked: timeAgo(product.last_checked_at),
    targetPrice: sub.target_price !== null ? Number(sub.target_price) : null,
    notifyAny: sub.notify_on_any_change,
    isFavorite: sub.is_favorite,
    series: [...(seriesMap.get(product.id) ?? [])].reverse(),
  }));

  return (
    <div>
      <div className="ad-in">
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">Favorilerim</h1>
        <p className="mt-0.5 text-zinc-500">
          Takip ettiğin ürünlerden yıldızladıkların; hızlı erişim için burada
          toplanır.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-[20px] border-2 border-dashed border-zinc-800 px-5 py-12 text-center text-zinc-500">
          <b className="mb-1 block text-zinc-50">Henüz favorin yok</b>
          &quot;Ürünlerim&quot; sayfasındaki bir kartın sağ üstündeki yıldıza
          tıklayarak favoriye ekleyebilirsin.
        </div>
      ) : (
        <div className="mt-3.5">
          <PortalProductsList items={items} />
        </div>
      )}
    </div>
  );
}