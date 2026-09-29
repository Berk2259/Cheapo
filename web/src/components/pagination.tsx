"use client";

import { useRouter } from "next/navigation";
import { AdminIcon } from "@/components/admin-icons";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export function Pagination({
  basePath,
  extraParams = {},
  page,
  pageSize,
  total,
}: {
  basePath: string;
  extraParams?: Record<string, string>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function go(nextPage: number, nextPageSize = pageSize) {
    const params = new URLSearchParams(extraParams);
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    router.push(`${basePath}?${params.toString()}`);
  }

  const navButton =
    "grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-40 disabled:hover:border-zinc-800 disabled:hover:text-zinc-400";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
      <div className="flex items-center gap-2">
        <span>Sayfa başına</span>
        <select
          value={pageSize}
          onChange={(e) => go(1, Number(e.target.value))}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-zinc-50 outline-none focus:border-emerald-500"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>
          {total === 0 ? "0 kayıt" : `${from}–${to} / ${total} kayıt`}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => go(1)}
          disabled={page <= 1}
          className={navButton}
          aria-label="İlk sayfa"
        >
          <span className="block rotate-180">
            <AdminIcon name="arrow" size={14} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className={navButton}
          aria-label="Önceki sayfa"
        >
          ‹
        </button>
        <span className="px-2 font-bold text-zinc-300">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className={navButton}
          aria-label="Sonraki sayfa"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => go(totalPages)}
          disabled={page >= totalPages}
          className={navButton}
          aria-label="Son sayfa"
        >
          <AdminIcon name="arrow" size={14} />
        </button>
      </div>
    </div>
  );
}