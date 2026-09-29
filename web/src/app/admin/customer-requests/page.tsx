import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import { CustomerRequestsList } from "@/components/customer-requests-list";

type Row = {
  id: number;
  note: string | null;
  status: string;
  created_at: string;
  customers: { name: string } | { name: string }[] | null;
  categories: { name: string } | { name: string }[] | null;
  customer_request_products: {
    products: { name: string } | { name: string }[] | null;
  }[];
};

function oneName(value: { name: string } | { name: string }[] | null): string {
  if (!value) return "-";
  return Array.isArray(value) ? (value[0]?.name ?? "-") : value.name;
}

export default async function CustomerRequestsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_requests")
    .select(
      "id, note, status, created_at, customers(name), categories(name), customer_request_products(products(name))",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const requests = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    note: r.note,
    status: r.status,
    created_at: r.created_at,
    customerName: oneName(r.customers),
    categoryName: oneName(r.categories),
    productNames: r.customer_request_products.map((cp) => oneName(cp.products)),
    ago: timeAgo(r.created_at),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Müşteri talepleri
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Müşterilerin portaldan gönderdiği devam talepleri. Tamamlandı
        işaretlenince seçilen ürünler otomatik takibe eklenir.
      </p>

      {error && (
        <p className="mt-6 text-sm text-red-600">Talepler alınamadı.</p>
      )}

      <CustomerRequestsList requests={requests} />
    </div>
  );
}