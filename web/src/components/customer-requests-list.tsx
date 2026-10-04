"use client";

import { useEffect, useState } from "react";
import {
  CustomerRequestRow,
  type CustomerRequest,
} from "@/components/customer-request-row";

const STATUS_OPTIONS = [
  { value: "bekliyor", label: "Bekliyor" },
  { value: "inceleniyor", label: "İnceleniyor" },
  { value: "tamamlandi", label: "Tamamlandı" },
  { value: "reddedildi", label: "Reddedildi" },
];

type Filter = "all" | string;

export function CustomerRequestsList({
  requests,
}: {
  requests: CustomerRequest[];
}) {
  // Bekleyen talep varsa "Bekliyor" filtresiyle açılır.
  const [filter, setFilter] = useState<Filter>(
    requests.some((r) => r.status === "bekliyor") ? "bekliyor" : "all",
  );
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const chips: { value: Filter; label: string }[] = [
    { value: "all", label: "Tümü" },
    ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
  ];

  const q = query.trim().toLocaleLowerCase("tr");
  const visible = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (!q) return true;
    return `${r.customerName} ${r.categoryName} ${r.note ?? ""} ${r.productNames.join(" ")}`
      .toLocaleLowerCase("tr")
      .includes(q);
  });

  useEffect(() => {
    setPage(1);
  }, [q, filter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);

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
            placeholder="Müşteri, kategori ya da ürün ara…"
            className="w-full bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const count =
              c.value === "all"
                ? requests.length
                : requests.filter((r) => r.status === c.value).length;
            const on = filter === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setFilter(c.value)}
                className={
                  "rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition " +
                  (on
                    ? "border-emerald-500 bg-emerald-500 text-[#052e2b]"
                    : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-emerald-500 hover:text-zinc-50")
                }
              >
                {c.label}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3">
        {pageItems.map((request, i) => (
          <div
            key={request.id}
            className="ad-in"
            style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
          >
            <CustomerRequestRow request={request} />
          </div>
        ))}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
            {requests.length === 0
              ? "Henüz talep yok."
              : "Bu filtreye uyan talep yok."}
          </div>
        )}
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
    </div>
  );
}