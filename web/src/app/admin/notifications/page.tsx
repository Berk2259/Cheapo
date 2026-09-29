import { createClient } from "@/lib/supabase/server";
import { clockTime, dayLabel } from "@/lib/time";
import { NotificationsList } from "@/components/notifications-list";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer } = await searchParams;
  const customerId = Number(customer);
  const filtered = Number.isInteger(customerId) && customerId > 0;

  const supabase = await createClient();

  const [logs, customers, products] = await Promise.all([
    supabase
      .from("notification_log")
      .select("id, customer_id, product_id, message, sent_at")
      .is("deleted_at", null)
      .order("sent_at", { ascending: false })
      .limit(100),
    supabase.from("customers").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("products").select("id, name").is("deleted_at", null),
  ]);

  const customerList = customers.data ?? [];
  const productList = products.data ?? [];

  const items = (logs.data ?? []).map((log) => ({
    id: log.id,
    customerId: log.customer_id,
    customerName:
      customerList.find((c) => c.id === log.customer_id)?.name ?? "-",
    productName:
      log.product_id === null
        ? "(silinmiş ürün)"
        : (productList.find((p) => p.id === log.product_id)?.name ?? "-"),
    message: log.message,
    day: dayLabel(log.sent_at),
    time: clockTime(log.sent_at),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Bildirimler
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Müşterilere gönderilen Telegram bildirimlerinin kaydı. En son 100 kayıt
        gösterilir.
      </p>

      {(logs.error || customers.error || products.error) && (
        <p className="mt-6 text-sm text-red-600">Veriler alınamadı.</p>
      )}

      <NotificationsList
        items={items}
        customers={customerList}
        initialCustomer={filtered ? String(customerId) : ""}
      />
    </div>
  );
}