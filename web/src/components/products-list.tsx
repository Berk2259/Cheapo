"use client";

import { useEffect, useState } from "react";
import { AdminIcon } from "@/components/admin-icons";
import { ProductRow } from "@/components/product-row";
import {
  ProductDrawer,
  type Option,
  type ProductData,
} from "@/components/product-drawer";

type Filter = "all" | "error" | "waiting" | "off";
type View = "list" | "group";

function isError(status: string | null) {
  return !!status && !status.startsWith("ok");
}

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "error", label: "Hatalı" },
  { value: "waiting", label: "Sırada" },
  { value: "off", label: "Pasif" },
];

function matches(p: ProductData, filter: Filter) {
  if (filter === "error") return p.is_active && isError(p.last_status);
  if (filter === "waiting") return p.is_active && !p.last_status;
  if (filter === "off") return !p.is_active;
  return true;
}

export function ProductsList({
  products,
  categories,
  sources,
}: {
  products: ProductData[];
  categories: Option[];
  sources: Option[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<ProductData | null>(null);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const canAdd = categories.length > 0 && sources.length > 0;

  const categoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name ?? "";
  const sourceName = (id: number) =>
    sources.find((s) => s.id === id)?.name ?? "";

  const q = query.trim().toLocaleLowerCase("tr");
  const visible = products.filter((p) => {
    if (!matches(p, filter)) return false;
    if (!q) return true;
    return `${p.name} ${categoryName(p.category_id)} ${sourceName(p.source_id)}`
      .toLocaleLowerCase("tr")
      .includes(q);
  });

  useEffect(() => {
    setPage(1);
  }, [q, filter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);

  // Görünüm "grup" ise ürünleri karşılaştırma grubuna göre kümeler;
  // grubu olmayanlar "Gruplanmamış" başlığı altında tek tek listelenir.
  const groups: { key: string; label: string; items: ProductData[] }[] = [];
  const solo: ProductData[] = [];
  if (view === "group") {
    const map = new Map<string, ProductData[]>();
    for (const p of visible) {
      const key = p.comparison_group ?? "";
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    for (const [key, items] of map) {
      if (key) groups.push({ key, label: key, items });
      else solo.push(...items);
    }
    groups.sort((a, b) => a.label.localeCompare(b.label, "tr"));
    solo.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  function closeDrawer() {
    setEditing(null);
    setAdding(false);
  }

  const rowProps = { categories, sources, onEdit: setEditing };

  return (
    <div className="mt-6">
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <label className="flex min-w-[260px] items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-500 transition focus-within:border-emerald-500 focus-within:shadow-[0_0_0_4px_rgba(45,212,191,0.13)]">
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün, kategori ya da kaynak ara…"
            className="w-full bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const count = products.filter((p) => matches(p, f.value)).length;
            const on = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={
                  "rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition " +
                  (on
                    ? "border-emerald-500 bg-emerald-500 text-[#052e2b]"
                    : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-emerald-500 hover:text-zinc-50")
                }
              >
                {f.label}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-[3px]">
          {(
            [
              ["list", "list", "Liste görünümü"],
              ["group", "scale", "Karşılaştırma grubuna göre"],
            ] as const
          ).map(([value, icon, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              title={label}
              aria-label={label}
              className={
                "grid place-items-center rounded-[9px] px-2.5 py-1.5 transition " +
                (view === value
                  ? "bg-emerald-500 text-[#052e2b]"
                  : "text-zinc-500 hover:text-zinc-50")
              }
            >
              <AdminIcon name={icon} size={17} />
            </button>
          ))}
        </div>

        {canAdd ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-[11px] bg-emerald-500 px-3.5 py-2 text-sm font-bold text-[#052e2b] transition hover:-translate-y-0.5"
          >
            <AdminIcon name="plus" size={16} /> Ürün ekle
          </button>
        ) : (
          <p className="ml-auto text-sm text-zinc-500">
            Ürün eklemek için önce en az bir kategori ve bir kaynak ekle.
          </p>
        )}
      </div>

      {view === "list" ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Ürün</th>
                  <th className="px-4 py-3 font-bold">Fiyat</th>
                  <th className="px-4 py-3 font-bold">Son kontrol</th>
                  <th className="px-4 py-3 font-bold">Durum</th>
                  <th className="px-4 py-3 font-bold">Yöntem</th>
                  <th className="px-4 py-3 text-right font-bold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {pageItems.map((product) => (
                  <ProductRow key={product.id} product={product} {...rowProps} />
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      {products.length === 0
                        ? "Henüz ürün yok."
                        : "Aramana uyan ürün bulunamadı."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {visible.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <span>Sayfa başına</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-zinc-50 outline-none focus:border-emerald-500"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span>
                  {(page - 1) * pageSize + 1}–{Math.min(visible.length, page * pageSize)} / {visible.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-40"
                >
                  ‹
                </button>
                <span className="px-2 font-bold text-zinc-300">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div
              key={g.key}
              className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
            >
              <div className="flex items-center gap-2.5 border-b border-zinc-800 bg-emerald-500/[0.06] px-4 py-3">
                <span className="text-emerald-300">
                  <AdminIcon name="scale" size={15} />
                </span>
                <b className="text-[14px] font-extrabold text-emerald-300">{g.label}</b>
                <span className="rounded-full bg-emerald-500/15 px-2 py-px text-[11px] font-bold text-emerald-300">
                  {g.items.length} kaynak
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">Ürün</th>
                      <th className="px-4 py-3 font-bold">Fiyat</th>
                      <th className="px-4 py-3 font-bold">Son kontrol</th>
                      <th className="px-4 py-3 font-bold">Durum</th>
                      <th className="px-4 py-3 font-bold">Yöntem</th>
                      <th className="px-4 py-3 text-right font-bold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {g.items.map((product) => (
                      <ProductRow key={product.id} product={product} {...rowProps} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {solo.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 bg-zinc-800/40 px-4 py-3">
                <b className="text-[14px] font-extrabold text-zinc-400">Gruplanmamış</b>
                <span className="rounded-full bg-zinc-700/60 px-2 py-px text-[11px] font-bold text-zinc-300">
                  {solo.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">Ürün</th>
                      <th className="px-4 py-3 font-bold">Fiyat</th>
                      <th className="px-4 py-3 font-bold">Son kontrol</th>
                      <th className="px-4 py-3 font-bold">Durum</th>
                      <th className="px-4 py-3 font-bold">Yöntem</th>
                      <th className="px-4 py-3 text-right font-bold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {solo.map((product) => (
                      <ProductRow key={product.id} product={product} {...rowProps} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {groups.length === 0 && solo.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-8 text-center text-zinc-500">
              {products.length === 0
                ? "Henüz ürün yok."
                : "Aramana uyan ürün bulunamadı."}
            </div>
          )}
        </div>
      )}

      {(editing || adding) && (
        <ProductDrawer
          key={editing?.id ?? "new"}
          product={editing}
          categories={categories}
          sources={sources}
          groups={[
            ...new Set(
              products
                .map((p) => p.comparison_group)
                .filter((g): g is string => !!g),
            ),
          ]}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}