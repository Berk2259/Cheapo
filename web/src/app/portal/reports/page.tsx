import { createClient } from "@/lib/supabase/server";
import { istanbulDayKey, lastDayKeys } from "@/lib/time";
import { PortalPremiumPreview } from "@/components/portal-premium-preview";
import {
  PortalReport,
  type ReportProduct,
} from "@/components/portal-report";

type Source = { name: string } | { name: string }[] | null;

type SubRow = {
  target_price: number | null;
  products:
    | {
        id: number;
        name: string;
        currency: string;
        categories: { name: string } | { name: string }[] | null;
        sources: Source;
      }
    | {
        id: number;
        name: string;
        currency: string;
        categories: { name: string } | { name: string }[] | null;
        sources: Source;
      }[]
    | null;
};

function sourceName(value: Source): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0]?.name ?? "") : value.name;
}

export default async function ReportsPage() {
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
    return <PortalPremiumPreview kind="reports" premium={false} />;
  }

  const { data: subData } = await supabase
    .from("subscriptions")
    .select("target_price, products(id, name, currency, categories(name), sources(name))")
    .eq("customer_id", customer.id);

  const subs = ((subData ?? []) as SubRow[])
    .map((s) => ({
      target: s.target_price !== null ? Number(s.target_price) : null,
      product: Array.isArray(s.products) ? s.products[0] : s.products,
    }))
    .filter((r) => !!r.product);

  const days = lastDayKeys(30);
  const productIds = subs.map((r) => r.product!.id);

  // Günün son fiyatı (price_daily görünümü). Pencerenin öncesinden de bir miktar
  // alırız ki ilk günün fiyatı boş kalmasın.
  const since = istanbulDayKey(new Date(Date.now() - 50 * 24 * 60 * 60 * 1000));
  const daily =
    productIds.length > 0
      ? await supabase
          .from("price_daily")
          .select("product_id, day, price")
          .in("product_id", productIds)
          .gte("day", since)
          .order("day", { ascending: true })
      : { data: [] as { product_id: number; day: string; price: number }[] };

  const byProduct = new Map<number, Map<string, number>>();
  for (const row of daily.data ?? []) {
    const m = byProduct.get(row.product_id) ?? new Map<string, number>();
    m.set(row.day, Number(row.price));
    byProduct.set(row.product_id, m);
  }

  const products: ReportProduct[] = subs.map(({ target, product }) => {
    const p = product!;
    const known = byProduct.get(p.id) ?? new Map<string, number>();

    // Pencereden önceki son bilinen fiyat.
    let last: number | null = null;
    for (const [day, price] of known) {
      if (day < days[0]) last = price;
    }

    const raw: (number | null)[] = days.map((d) => {
      const v = known.get(d);
      if (v !== undefined) last = v;
      return last;
    });

    // Baştaki boş günleri ilk bilinen fiyatla doldur.
    const firstKnown = raw.find((v) => v !== null);
    const series =
      firstKnown === undefined
        ? []
        : raw.map((v) => (v === null ? (firstKnown as number) : v));

    const category = Array.isArray(p.categories)
      ? (p.categories[0]?.name ?? "")
      : (p.categories?.name ?? "");
    const source = sourceName(p.sources);

    return {
      id: p.id,
      name: p.name,
      category,
      source,
      currency: p.currency,
      target,
      series,
    };
  });

  // Günlük bildirim sayıları (Türkiye saatine göre).
  const notif = await supabase
    .from("notification_log")
    .select("sent_at")
    .eq("customer_id", customer.id)
    .gte("sent_at", new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1000);

  const counts = new Map<string, number>();
  for (const n of notif.data ?? []) {
    const key = istanbulDayKey(new Date(n.sent_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const notifications = days.map((d) => counts.get(d) ?? 0);

  return (
    <PortalReport
      days={days}
      products={products}
      notifications={notifications}
    />
  );
}