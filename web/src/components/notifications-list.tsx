"use client";

import { useEffect, useState } from "react";
import {
  NotificationRow,
  type NotificationItem,
} from "@/components/notification-row";

type Customer = { id: number; name: string };

export function NotificationsList({
  items,
  customers,
  initialCustomer,
}: {
  items: NotificationItem[];
  customers: Customer[];
  initialCustomer: string;
}) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [query, setQuery] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const q = query.trim().toLocaleLowerCase("tr");
  const visible = items.filter((n) => {
    if (customer && String(n.customerId) !== customer) return false;
    if (!q) return true;
    return `${n.productName} ${n.customerName} ${n.message}`
      .toLocaleLowerCase("tr")
      .includes(q);
  });

  useEffect(() => {
    setPage(1);
  }, [q, customer, pageSize]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);

  // Liste zaten yeniden eskiye sıralı, aynı günleri art arda grupla.
  const groups: { label: string; items: NotificationItem[] }[] = [];
  for (const n of pageItems) {
    const last = groups[groups.length - 1];
    if (last && last.label === n.day) {
      last.items.push(n);
    } else {
      groups.push({ label: n.day, items: [n] });
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
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
            placeholder="Ürün, müşteri ya da mesaj ara…"
            className="w-full bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
          />
        </label>

        <select
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          aria-label="Müşteri"
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none transition focus:border-emerald-500"
        >
          <option value="">Tüm müşteriler</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <span className="ml-auto text-sm text-zinc-500">
          {visible.length} bildirim
        </span>
      </div>

      {groups.map((group) => (
        <section key={group.label} className="mb-5">
          <h3 className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-500">
            {group.label}
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
              {group.items.length}
            </span>
          </h3>
          <div className="grid gap-2.5">
            {group.items.map((n, i) => (
              <div
                key={n.id}
                className="ad-in"
                style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
              >
                <NotificationRow item={n} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {visible.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
          {items.length === 0
            ? "Henüz bildirim gönderilmedi."
            : "Bu filtreye uyan bildirim yok."}
        </div>
      )}

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
    </div>
  );
}