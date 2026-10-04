import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import { TrashList, type TrashItem } from "@/components/trash-list";

type NameRef = { name: string } | { name: string }[] | null;
function oneName(v: NameRef): string {
  if (!v) return "-";
  return Array.isArray(v) ? (v[0]?.name ?? "-") : v.name;
}

export default async function TrashPage() {
  const supabase = await createClient();

  const [products, sources, categories, customers, subscriptions, notifications, priceHistory, customerRequests] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, deleted_at")
        .not("deleted_at", "is", null),
      supabase
        .from("sources")
        .select("id, name, deleted_at")
        .not("deleted_at", "is", null),
      supabase
        .from("categories")
        .select("id, name, deleted_at")
        .not("deleted_at", "is", null),
      supabase
        .from("customers")
        .select("id, name, deleted_at")
        .not("deleted_at", "is", null),
      supabase
        .from("subscriptions")
        .select("id, deleted_at, customers(name), products(name)")
        .not("deleted_at", "is", null),
      supabase
        .from("notification_log")
        .select("id, message, deleted_at")
        .not("deleted_at", "is", null),
      supabase
        .from("price_history")
        .select("id, price, currency, checked_at, deleted_at")
        .not("deleted_at", "is", null),
      supabase
        .from("customer_requests")
        .select("id, deleted_at, customers(name), categories(name)")
        .not("deleted_at", "is", null),
    ]);

  const items: TrashItem[] = [
    ...(products.data ?? []).map((p) => ({
      table: "products" as const,
      id: p.id,
      title: p.name,
      subtitle: "Ürün",
      deletedAgo: timeAgo(p.deleted_at),
    })),
    ...(sources.data ?? []).map((s) => ({
      table: "sources" as const,
      id: s.id,
      title: s.name,
      subtitle: "Kaynak",
      deletedAgo: timeAgo(s.deleted_at),
    })),
    ...(categories.data ?? []).map((c) => ({
      table: "categories" as const,
      id: c.id,
      title: c.name,
      subtitle: "Kategori",
      deletedAgo: timeAgo(c.deleted_at),
    })),
    ...(customers.data ?? []).map((c) => ({
      table: "customers" as const,
      id: c.id,
      title: c.name,
      subtitle: "Müşteri",
      deletedAgo: timeAgo(c.deleted_at),
    })),
    ...(subscriptions.data ?? []).map((s) => ({
      table: "subscriptions" as const,
      id: s.id,
      title: `${oneName(s.customers)} → ${oneName(s.products)}`,
      subtitle: "Takip",
      deletedAgo: timeAgo(s.deleted_at),
    })),
    ...(notifications.data ?? []).map((n) => ({
      table: "notification_log" as const,
      id: n.id,
      title: n.message.slice(0, 80),
      subtitle: "Bildirim",
      deletedAgo: timeAgo(n.deleted_at),
    })),
    ...(priceHistory.data ?? []).map((p) => ({
      table: "price_history" as const,
      id: p.id,
      title: `${Number(p.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${p.currency}`,
      subtitle: "Fiyat kaydı",
      deletedAgo: timeAgo(p.checked_at),
    })),
    ...(customerRequests.data ?? []).map((r) => ({
      table: "customer_requests" as const,
      id: r.id,
      title: `${oneName(r.customers)} → ${oneName(r.categories)}`,
      subtitle: "Müşteri talebi",
      deletedAgo: timeAgo(r.deleted_at),
    })),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Çöp kutusu
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Panelde silinen kayıtlar önce buraya düşer, veritabanından hemen
        silinmez. Geri yükleyebilir ya da kalıcı olarak silebilirsin.
      </p>

      <TrashList items={items} />
    </div>
  );
}