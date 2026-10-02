import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import { PortalPlanCard } from "@/components/portal-plan-card";
import type { PortalProduct } from "@/components/portal-product-card";
import { PortalProductsList } from "@/components/portal-products-list";
import { PortalTeasers } from "@/components/portal-teasers";
import { PortalTelegramCard } from "@/components/portal-telegram-card";
import { PortalStats } from "@/components/portal-stats";
import { PortalDealBanner } from "@/components/portal-deal-banner";
import { PortalFeed, type FeedItem } from "@/components/portal-feed";

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

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, plan, telegram_chat_id, link_token")
    .eq("auth_user_id", user?.id ?? "")
    .maybeSingle();

  if (!customer) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, target_price, notify_on_any_change, is_favorite, products(id, name, url, current_price, currency, last_checked_at, category_id, categories(name), sources(name))",
    )
    .eq("customer_id", customer.id);

  const subs = ((data ?? []) as Subscription[])
    .map((s) => ({
      sub: s,
      product: Array.isArray(s.products) ? s.products[0] : s.products,
    }))
    .filter(
      (row): row is { sub: Subscription; product: Product } => !!row.product,
    );

  // Fiyat çizgisi için geçmiş fiyatlar. Okuma izni yoksa boş döner ve çizgi gösterilmez.
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

  const categoryCount = new Set(subs.map((r) => r.product.category_id)).size;

  // Özet kutuları ve fırsat bandı için hesaplar.
  const withTarget = items.filter((p) => p.targetPrice !== null);
  const belowTarget = items.filter(
    (p) =>
      p.targetPrice !== null &&
      p.currentPrice !== null &&
      p.currentPrice <= p.targetPrice,
  );
  const dropped = items.filter((p) => {
    if (p.series.length < 2) return false;
    const start = p.series[Math.max(0, p.series.length - 7)];
    return p.series[p.series.length - 1] < start;
  }).length;
  const lastCheckedIso =
    subs
      .map((r) => r.product.last_checked_at)
      .filter((v): v is string => !!v)
      .sort()
      .at(-1) ?? null;

  const premium = customer.plan === "premium";
  const bound = !!customer.telegram_chat_id;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const linkUrl =
    !bound && botUsername && customer.link_token
      ? `https://t.me/${botUsername}?start=${customer.link_token}`
      : null;

  const firstName = customer.name.trim().split(" ")[0];

  // Son bildirimler. İzin yoksa boş döner ve "Henüz bildirim almadın" görünür.
  const notifications = await supabase
    .from("notification_log")
    .select("id, message, sent_at, products(name)")
    .eq("customer_id", customer.id)
    .order("sent_at", { ascending: false })
    .limit(3);

  const feedItems: FeedItem[] = (notifications.data ?? []).map((n) => {
    const product = Array.isArray(n.products) ? n.products[0] : n.products;
    const lines = String(n.message).split("\n");
    return {
      id: n.id,
      product: product?.name ?? lines[1] ?? "Bildirim",
      line: lines.find((l) => l.includes("→")) ?? "",
      ago: timeAgo(n.sent_at),
    };
  });

  return (
    <div>
      <div className="ad-in">
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">
          Merhaba {firstName} 👋
        </h1>
        <p className="mt-1 text-zinc-500">
          {items.length} ürünü takip ediyorsun. Fiyat düşünce Telegram&apos;dan
          haber vereceğiz.
        </p>
      </div>

      {error && (
        <p className="mt-6 text-sm text-red-500">Ürünler alınamadı.</p>
      )}

      {items.length > 0 && (
        <>
          <PortalStats
            total={items.length}
            categories={categoryCount}
            belowTarget={belowTarget.length}
            withTarget={withTarget.length}
            dropped={dropped}
            lastChecked={timeAgo(lastCheckedIso)}
          />
          {belowTarget.length > 0 && (
            <PortalDealBanner
              names={belowTarget.map((p) => p.name)}
              url={belowTarget[0].url}
            />
          )}
        </>
      )}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Sol: ürünler */}
        <div>
          <h2 className="mb-3.5 text-lg font-bold">Takip ettiklerin</h2>

          {items.length === 0 ? (
            <div className="rounded-[20px] border-2 border-dashed border-zinc-800 px-5 py-10 text-center text-zinc-500">
              <p>Henüz takip edilen bir ürünün yok.</p>
              <Link
                href="/portal/requests"
                className="mt-3 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-extrabold text-[#052e2b]"
              >
                İlk talebini gönder
              </Link>
            </div>
          ) : (
            <PortalProductsList items={items} />
          )}
        </div>

        {/* Sağ: plan, Telegram, Premium önizlemeleri */}
        <div
          className="ad-in grid gap-3.5 lg:sticky lg:top-20"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <PortalPlanCard
            plan={customer.plan ?? "free"}
            categories={categoryCount}
            products={items.length}
          />
          <PortalTelegramCard bound={bound} linkUrl={linkUrl} />
          <PortalTeasers premium={premium} />
          <PortalFeed items={feedItems} />
        </div>
      </div>
    </div>
  );
}