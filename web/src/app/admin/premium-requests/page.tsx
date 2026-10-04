import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import { PremiumRequestsList } from "@/components/premium-requests-list";

type CustomerRef = {
  id: number;
  name: string;
  plan: string;
  telegram_chat_id: number | null;
};

type Row = {
  id: number;
  phone: string | null;
  note: string | null;
  status: string;
  created_at: string;
  customers: CustomerRef | CustomerRef[] | null;
};

function one(v: CustomerRef | CustomerRef[] | null): CustomerRef | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function PremiumRequestsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_premium_requests")
    .select("id, phone, note, status, created_at, customers(id, name, plan, telegram_chat_id)")
    .order("created_at", { ascending: false });

  const items = ((data ?? []) as Row[]).map((r) => {
    const c = one(r.customers);
    return {
      id: r.id,
      customerId: c?.id ?? 0,
      customerName: c?.name ?? "-",
      plan: c?.plan ?? "free",
      bound: !!c?.telegram_chat_id,
      phone: r.phone,
      note: r.note,
      status: r.status,
      ago: timeAgo(r.created_at),
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Premium talepleri
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Müşterilerin &quot;Planım&quot; sayfasından gönderdiği Premium&apos;a geçme
        talepleri. Onayla, planı otomatik Premium yapar; reddet, talebi temizler.
      </p>

      {error && <p className="mt-6 text-sm text-red-600">Talepler alınamadı.</p>}

      <PremiumRequestsList items={items} />
    </div>
  );
}