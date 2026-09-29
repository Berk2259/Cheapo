import { createClient } from "@/lib/supabase/server";
import { dayLabel } from "@/lib/time";
import { AddCategoryForm } from "@/components/add-category-form";
import { CategoryRow } from "@/components/category-row";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const [categories, products, links] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, created_at")
      .is("deleted_at", null)
      .order("id"),
    supabase.from("products").select("category_id").is("deleted_at", null),
    supabase.from("customer_categories").select("category_id"),
  ]);

  const count = (rows: { category_id: number }[] | null, id: number) =>
    (rows ?? []).filter((r) => r.category_id === id).length;

  const items = (categories.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    added: dayLabel(c.created_at),
    productCount: count(products.data, c.id),
    customerCount: count(links.data, c.id),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Kategoriler
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Ürünlerin ve müşterilerin ilgi alanlarını gruplayan kategoriler.
      </p>

      {(categories.error || products.error || links.error) && (
        <p className="mt-6 text-sm text-red-600">Veriler alınamadı.</p>
      )}

      <AddCategoryForm />

      <div className="mt-6 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((category, i) => (
          <div
            key={category.id}
            className="ad-in"
            style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
          >
            <CategoryRow category={category} />
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500 sm:col-span-2 xl:col-span-3">
            Henüz kategori yok.
          </div>
        )}
      </div>
    </div>
  );
}