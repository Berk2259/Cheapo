import { createClient } from "@/lib/supabase/server";
import { dayLabel, timeAgo } from "@/lib/time";
import { RemovalRequestsList } from "@/components/removal-requests-list";

export default async function RemovalRequestsPage() {
  const supabase = await createClient();

  const { data: customersData, error } = await supabase
    .from("customers")
    .select("id, name, plan, telegram_chat_id, created_at, removal_requested_at")
    .not("removal_requested_at", "is", null)
    .is("deleted_at", null)
    .order("removal_requested_at", { ascending: false });

  const customers = customersData ?? [];
  const ids = customers.map((c) => c.id);

  const [subs, notifs] = await Promise.all([
    ids.length > 0
      ? supabase
          .from("subscriptions")
          .select("customer_id")
          .in("customer_id", ids)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] as { customer_id: number }[] }),
    ids.length > 0
      ? supabase.from("notification_log").select("customer_id").in("customer_id", ids)
      : Promise.resolve({ data: [] as { customer_id: number }[] }),
  ]);

  const subRows = subs.data ?? [];
  const notifRows = notifs.data ?? [];

  const items = customers.map((c) => ({
    id: c.id,
    name: c.name,
    plan: c.plan ?? "free",
    bound: !!c.telegram_chat_id,
    joined: dayLabel(c.created_at),
    requestedAgo: timeAgo(c.removal_requested_at),
    productCount: subRows.filter((s) => s.customer_id === c.id).length,
    notifCount: notifRows.filter((n) => n.customer_id === c.id).length,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Hesap kaldırma talepleri
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Müşterilerin &quot;Hesap ayarları&quot;ndan gönderdiği kaldırma talepleri.
        Onaylarsan hesap normal silme akışıyla çöp kutusuna atılır; reddedersen
        müşteri hesabı kullanmaya devam eder.
      </p>

      {error && <p className="mt-6 text-sm text-red-600">Talepler alınamadı.</p>}

      <RemovalRequestsList items={items} />
    </div>
  );
}