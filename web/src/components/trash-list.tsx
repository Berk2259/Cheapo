"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import {
  permanentlyDelete,
  restoreFromTrash,
  type TrashTable,
} from "@/app/admin/trash/actions";

export type TrashItem = {
  table: TrashTable;
  id: number;
  title: string;
  subtitle: string;
  deletedAgo: string;
};

const TABLE_LABELS: Record<TrashTable, string> = {
  products: "Ürün",
  sources: "Kaynak",
  categories: "Kategori",
  customers: "Müşteri",
  subscriptions: "Takip",
  notification_log: "Bildirim",
  price_history: "Fiyat kaydı",
  customer_requests: "Müşteri talebi",
};

const filters: { value: "all" | TrashTable; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "products", label: "Ürünler" },
  { value: "sources", label: "Kaynaklar" },
  { value: "categories", label: "Kategoriler" },
  { value: "customers", label: "Müşteriler" },
  { value: "subscriptions", label: "Takipler" },
  { value: "notification_log", label: "Bildirimler" },
  { value: "price_history", label: "Fiyat kayıtları" },
  { value: "customer_requests", label: "Müşteri talepleri" },
];

function TrashRow({ item }: { item: TrashItem }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function restore() {
    setMessage(null);
    startTransition(async () => {
      const result = await restoreFromTrash(item.table, item.id);
      if (!result.ok) setMessage(result.message ?? "Geri yüklenemedi.");
    });
  }

  function remove() {
    const ok = confirm(
      `"${item.title}" kalıcı olarak silinecek. Bu işlem geri alınamaz, emin misin?`,
    );
    if (!ok) return;
    setMessage(null);
    startTransition(async () => {
      const result = await permanentlyDelete(item.table, item.id);
      if (!result.ok) setMessage(result.message ?? "Silinemedi.");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 py-3 first:border-t-0">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-zinc-800/60 text-zinc-400">
        <AdminIcon name="trash" size={15} />
      </span>
      <div className="min-w-0 flex-1 basis-56">
        <p className="truncate text-sm font-bold text-zinc-50">{item.title}</p>
        <p className="text-xs text-zinc-500">
          {TABLE_LABELS[item.table]} · {item.deletedAgo} silindi
        </p>
        {message && <p className="mt-1 text-xs text-red-500">{message}</p>}
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={restore}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:border-emerald-500 disabled:opacity-50"
        >
          <AdminIcon name="refresh" size={13} /> Geri yükle
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-red-900/50 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:border-red-500 disabled:opacity-50"
        >
          <AdminIcon name="x" size={13} /> Kalıcı sil
        </button>
      </div>
    </div>
  );
}

export function TrashList({ items }: { items: TrashItem[] }) {
  const [filter, setFilter] = useState<"all" | TrashTable>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLocaleLowerCase("tr");
  const visible = items.filter((i) => {
    if (filter !== "all" && i.table !== filter) return false;
    if (!q) return true;
    return `${i.title} ${i.subtitle}`.toLocaleLowerCase("tr").includes(q);
  });

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
            placeholder="Ara…"
            className="w-full bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const count =
              f.value === "all"
                ? items.length
                : items.filter((i) => i.table === f.value).length;
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
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-[18px]">
        {visible.map((item) => (
          <TrashRow key={`${item.table}-${item.id}`} item={item} />
        ))}
        {visible.length === 0 && (
          <div className="py-10 text-center text-zinc-500">
            {items.length === 0
              ? "Çöp kutusu boş."
              : "Bu filtreye uyan kayıt yok."}
          </div>
        )}
      </div>
    </div>
  );
}