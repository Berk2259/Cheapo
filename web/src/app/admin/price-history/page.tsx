import { createClient } from "@/lib/supabase/server";
import { shortDateTime } from "@/lib/time";
import { PriceChart } from "@/components/price-chart";
import { PriceHistoryFilter } from "@/components/price-history-filter";
import { PriceRecordRow } from "@/components/price-record-row";
import { Pagination } from "@/components/pagination";

export default async function PriceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; page?: string; pageSize?: string }>;
}) {
  const { product, page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const productId = Number(product);
  const filtered = Number.isInteger(productId) && productId > 0;

  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = [25, 50, 100, 200].includes(Number(pageSizeParam))
    ? Number(pageSizeParam)
    : 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  let recordsQuery = supabase
    .from("price_history")
    .select("id, product_id, price, currency, in_stock, checked_at", {
      count: "exact",
    });
  if (filtered) {
    recordsQuery = recordsQuery.eq("product_id", productId);
  }

  const [records, products] = await Promise.all([
    recordsQuery.order("checked_at", { ascending: false }).range(from, to),
    supabase.from("products").select("id, name").order("name"),
  ]);

  const productList = products.data ?? [];
  const rows = records.data ?? []; // yeniden eskiye
  const total = records.count ?? 0;

  // Her kaydın, aynı ürünün bir önceki kaydına göre değişimi (%). Sadece bu
  // sayfadaki kayıtlar arasında hesaplanır; sayfanın en eski kaydı için bir
  // önceki kayıt başka sayfadaysa değişim gösterilmez.
  const changes = new Map<number, number | null>();
  const previous = new Map<number, number>();
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const price = Number(r.price);
    const before = previous.get(r.product_id);
    changes.set(
      r.id,
      before !== undefined && before > 0 ? ((price - before) / before) * 100 : null,
    );
    previous.set(r.product_id, price);
  }

  const items = rows.map((r) => ({
    id: r.id,
    productName: productList.find((p) => p.id === r.product_id)?.name ?? "-",
    price: Number(r.price),
    currency: r.currency,
    inStock: r.in_stock,
    when: shortDateTime(r.checked_at),
    changePct: changes.get(r.id) ?? null,
  }));

  const selectedName = filtered
    ? (productList.find((p) => p.id === productId)?.name ?? "Ürün")
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Fiyat geçmişi
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Botun her kontrolde kaydettiği fiyatlar.
      </p>

      {(records.error || products.error) && (
        <p className="mt-6 text-sm text-red-600">Veriler alınamadı.</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <PriceHistoryFilter
          products={productList}
          current={filtered ? String(productId) : ""}
        />
        <span className="ml-auto text-sm text-zinc-500">{total} kayıt</span>
      </div>

      {selectedName && (
        <PriceChart
          productName={selectedName}
          currency={rows[0]?.currency ?? "TL"}
          points={[...rows]
            .reverse()
            .map((r) => ({ price: Number(r.price), at: r.checked_at }))}
        />
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-bold">Zaman</th>
              <th className="px-4 py-3 font-bold">Ürün</th>
              <th className="px-4 py-3 font-bold">Fiyat</th>
              <th className="px-4 py-3 font-bold">Değişim</th>
              <th className="px-4 py-3 font-bold">Stok</th>
              <th className="px-4 py-3 text-right font-bold">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {items.map((item) => (
              <PriceRecordRow key={item.id} item={item} />
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        basePath="/admin/price-history"
        extraParams={filtered ? { product: String(productId) } : {}}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
}