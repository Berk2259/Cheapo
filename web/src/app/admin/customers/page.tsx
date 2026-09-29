import { createClient } from "@/lib/supabase/server";
import { dayLabel } from "@/lib/time";
import { CustomersList } from "@/components/customers-list";

export default async function CustomersPage() {
  const supabase = await createClient();
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  const [customers, categories, customerCategories, subscriptions] =
    await Promise.all([
      supabase
        .from("customers")
        .select(
          "id, name, telegram_chat_id, link_token, is_active, created_at, plan, auth_user_id",
        )
        .is("deleted_at", null)
        .order("id"),
      supabase.from("categories").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("customer_categories").select("customer_id, category_id"),
      supabase.from("subscriptions").select("customer_id").is("deleted_at", null),
    ]);

  const categoryList = categories.data ?? [];
  const links = customerCategories.data ?? [];
  const subs = subscriptions.data ?? [];

  const items = (customers.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    plan: c.plan ?? "free",
    bound: !!c.telegram_chat_id,
    chatId: c.telegram_chat_id,
    active: c.is_active,
    added: dayLabel(c.created_at),
    categoryIds: links
      .filter((l) => l.customer_id === c.id)
      .map((l) => l.category_id),
    subCount: subs.filter((s) => s.customer_id === c.id).length,
    linkUrl:
      !c.telegram_chat_id && botUsername
        ? `https://t.me/${botUsername}?start=${c.link_token}`
        : null,
    hasPortal: !!c.auth_user_id,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Müşteriler
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sisteme kayıtlı tüm müşteriler, planları, Telegram bağlantı durumları
        ve ilgilendikleri kategoriler.
      </p>

      {(customers.error ||
        categories.error ||
        customerCategories.error ||
        subscriptions.error) && (
        <p className="mt-6 text-sm text-red-600">Veriler alınamadı.</p>
      )}

      <CustomersList customers={items} categories={categoryList} />
    </div>
  );
}