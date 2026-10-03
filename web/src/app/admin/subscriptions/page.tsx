import { createClient } from "@/lib/supabase/server";
import { SubscriptionsList } from "@/components/subscriptions-list";

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const [subscriptions, customers, products] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, customer_id, product_id, target_price, notify_on_any_change")
      .is("deleted_at", null)
      .order("id"),
    supabase
      .from("customers")
      .select("id, name, telegram_chat_id, is_active")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("products")
      .select("id, name, current_price, currency, sources(name)")
      .is("deleted_at", null)
      .order("name"),
  ]);

  const customerList = customers.data ?? [];
  const productList = products.data ?? [];

  function sourceName(value: { name: string } | { name: string }[] | null | undefined): string {
    if (!value) return "";
    return Array.isArray(value) ? (value[0]?.name ?? "") : value.name;
  }

  const items = (subscriptions.data ?? []).map((s) => {
    const customer = customerList.find((c) => c.id === s.customer_id);
    const product = productList.find((p) => p.id === s.product_id);
    return {
      id: s.id,
      customerId: s.customer_id,
      customerName: customer?.name ?? "-",
      productName: product?.name ?? "-",
      sourceName: sourceName(product?.sources),
      currentPrice:
        product?.current_price != null ? Number(product.current_price) : null,
      currency: product?.currency ?? "TRY",
      targetPrice: s.target_price != null ? Number(s.target_price) : null,
      notifyAny: s.notify_on_any_change,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Takipler
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Hangi müşteri hangi ürünü, hangi kurala göre takip ediyor. Bildirimler
        bu kurallara göre gider.
      </p>

      {(subscriptions.error || customers.error || products.error) && (
        <p className="mt-6 text-sm text-red-600">Veriler alınamadı.</p>
      )}

      <SubscriptionsList
        items={items}
        customers={customerList.map((c) => ({
          id: c.id,
          name: c.name,
          bound: !!c.telegram_chat_id,
          active: c.is_active,
        }))}
        productOptions={productList.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}