import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import { LeadsList } from "@/components/leads-list";

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      "id, name, contact, plan_requested, category_interest, note, status, created_at, converted_customer_id",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const items = (leads ?? []).map((lead) => ({
    ...lead,
    ago: timeAgo(lead.created_at),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Talepler
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Landing page üzerinden gelen talepler. Durumu değiştir, uygun
        bulduklarına hesap aç.
      </p>

      {error && (
        <p className="mt-6 text-sm text-red-600">Talepler alınamadı.</p>
      )}

      <LeadsList leads={items} />
    </div>
  );
}