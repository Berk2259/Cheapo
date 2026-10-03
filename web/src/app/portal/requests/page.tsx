import { createClient } from "@/lib/supabase/server";
import { CustomerRequestForm } from "@/components/customer-request-form";
import {
  PortalRequestCard,
  type PortalRequest,
} from "@/components/portal-request-card";

type RequestRow = {
  id: number;
  note: string | null;
  status: string;
  created_at: string;
  categories: { name: string } | { name: string }[] | null;
  customer_request_products: {
    products: { name: string } | { name: string }[] | null;
  }[];
};

type FollowedRow = {
  product_id: number;
  products: { category_id: number } | { category_id: number }[] | null;
};

function oneName(value: { name: string } | { name: string }[] | null): string {
  if (!value) return "-";
  return Array.isArray(value) ? (value[0]?.name ?? "-") : value.name;
}

export default async function CustomerRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, plan")
    .eq("auth_user_id", user?.id ?? "")
    .maybeSingle();

  const [categories, products, requests, followed] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("products")
      .select("id, name, category_id, current_price, currency, sources(name)")
      .eq("is_active", true),
    customer
      ? supabase
          .from("customer_requests")
          .select(
            "id, note, status, created_at, categories(name), customer_request_products(products(name))",
          )
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as RequestRow[] }),
    customer
      ? supabase
          .from("subscriptions")
          .select("product_id, products(category_id)")
          .eq("customer_id", customer.id)
      : Promise.resolve({ data: [] as FollowedRow[] }),
  ]);

  function sourceName(value: { name: string } | { name: string }[] | null | undefined): string {
    if (!value) return "";
    return Array.isArray(value) ? (value[0]?.name ?? "") : value.name;
  }

  const productList = (products.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category_id: p.category_id,
    current_price: p.current_price,
    currency: p.currency,
    source: sourceName(p.sources),
  }));
  const followedRows = (followed.data ?? []) as FollowedRow[];

  const followedProductIds = followedRows.map((f) => f.product_id);
  const followedCategoryIds = [
    ...new Set(
      followedRows
        .map((f) =>
          Array.isArray(f.products) ? f.products[0]?.category_id : f.products?.category_id,
        )
        .filter((id): id is number => typeof id === "number"),
    ),
  ];

  const categoryList = (categories.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    productCount: productList.filter((p) => p.category_id === c.id).length,
  }));

  const requestList: PortalRequest[] = ((requests.data ?? []) as RequestRow[]).map(
    (r) => ({
      id: r.id,
      category: oneName(r.categories),
      products: r.customer_request_products.map((cp) => oneName(cp.products)),
      note: r.note,
      status: r.status,
      date: new Date(r.created_at).toLocaleDateString("tr-TR"),
    }),
  );

  return (
    <div>
      <div className="ad-in">
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">
          Yeni talep gönder
        </h1>
        <p className="mt-1 text-zinc-500">
          Takip etmek istediğin ürünleri seç, ekibimiz inceleyip takibe ekler.
        </p>
      </div>

      <CustomerRequestForm
        categories={categoryList}
        products={productList}
        followedProductIds={followedProductIds}
        followedCategoryIds={followedCategoryIds}
        plan={customer?.plan ?? "free"}
      />

      <h2 className="mb-1 mt-9 text-lg font-bold">Taleplerim</h2>
      <div className="grid gap-3">
        {requestList.map((r, i) => (
          <div
            key={r.id}
            className="ad-in"
            style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
          >
            <PortalRequestCard request={r} />
          </div>
        ))}
        {requestList.length === 0 && (
          <p className="text-sm text-zinc-500">Henüz talep göndermediniz.</p>
        )}
      </div>
    </div>
  );
}