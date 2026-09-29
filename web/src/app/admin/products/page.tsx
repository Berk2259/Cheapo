import { createClient } from "@/lib/supabase/server";
import { ProductsList } from "@/components/products-list";

export default async function ProductsPage() {
  const supabase = await createClient();

  const [products, categories, sources] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, url, category_id, source_id, current_price, currency, check_interval_minutes, last_checked_at, last_status, is_active, force_check_requested, comparison_group",
      )
      .is("deleted_at", null)
      .order("id"),
    supabase.from("categories").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("sources").select("id, name").is("deleted_at", null).order("name"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Ürünler
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Fiyatı takip edilen ürünler. Bot bu listeyi okuyup fiyatları kontrol
        eder.
      </p>

      {(products.error || categories.error || sources.error) && (
        <p className="mt-6 text-sm text-red-600">Veriler alınamadı.</p>
      )}

      <ProductsList
        products={products.data ?? []}
        categories={categories.data ?? []}
        sources={sources.data ?? []}
      />
    </div>
  );
}