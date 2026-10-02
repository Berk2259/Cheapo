"use client";

import { useState } from "react";
import { AdminIcon } from "@/components/admin-icons";
import {
  PortalProductCard,
  type PortalProduct,
} from "@/components/portal-product-card";
import { changePct, gapPct } from "@/lib/product-stats";

type Sort = "def" | "drop" | "target" | "name";
type View = "cards" | "list";

function money(value: number, currency: string) {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function pct(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

function ListRow({ item }: { item: PortalProduct }) {
  const change = changePct(item.series);
  const gap = gapPct(item);

  return (
    <div className="grid gap-2 border-t border-zinc-800 px-[18px] py-3 transition-colors first:border-t-0 hover:bg-emerald-500/10 sm:grid-cols-[1.6fr_110px_130px_150px_60px] sm:items-center sm:gap-3.5">
      <div className="min-w-0">
        <b className="block font-extrabold">{item.name}</b>
        <small className="text-zinc-500">
          {item.source && `${item.source} · `}
          {item.lastChecked}
        </small>
      </div>

      <div className="font-extrabold tabular-nums">
        {item.currentPrice !== null
          ? money(item.currentPrice, item.currency)
          : "-"}
      </div>

      <div>
        {change === null ? (
          <span className="text-zinc-500">-</span>
        ) : Math.abs(change) < 0.05 ? (
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[12.5px] font-extrabold text-zinc-400">
            değişmedi
          </span>
        ) : (
          <span
            className={
              "rounded-full px-2.5 py-0.5 text-[12.5px] font-extrabold " +
              (change < 0
                ? "bg-green-400/15 text-green-400"
                : "bg-red-400/15 text-red-400")
            }
          >
            {change < 0 ? "↓" : "↑"} %{pct(change)}
          </span>
        )}
      </div>

      <div className="text-sm">
        {gap === null ? (
          <span className="text-zinc-500">Hedef yok</span>
        ) : gap <= 0 ? (
          <b className="text-green-400">Hedefin altında ✓</b>
        ) : (
          <b>Hedefe %{pct(gap)} uzak</b>
        )}
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-extrabold text-emerald-500 hover:text-emerald-400 sm:justify-end"
      >
        Aç <AdminIcon name="external" size={13} />
      </a>
    </div>
  );
}

export function PortalProductsList({ items }: { items: PortalProduct[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("def");
  const [view, setView] = useState<View>("cards");

  const q = query.trim().toLocaleLowerCase("tr");
  let visible = items.filter(
    (p) =>
      !q ||
      `${p.name} ${p.category}`.toLocaleLowerCase("tr").includes(q),
  );

  if (sort === "drop") {
    visible = [...visible].sort(
      (a, b) => (changePct(a.series) ?? 0) - (changePct(b.series) ?? 0),
    );
  } else if (sort === "target") {
    visible = [...visible].sort(
      (a, b) => (gapPct(a) ?? 1e9) - (gapPct(b) ?? 1e9),
    );
  } else if (sort === "name") {
    visible = [...visible].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex min-w-0 flex-1 basis-[200px] items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-500 transition focus-within:border-emerald-500 focus-within:shadow-[0_0_0_4px_rgba(45,212,191,0.13)] sm:max-w-[300px]">
          <AdminIcon name="search" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün ara…"
            className="w-full bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
          />
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sırala"
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none transition focus:border-emerald-500"
        >
          <option value="def">Sırala: varsayılan</option>
          <option value="drop">En çok düşen</option>
          <option value="target">Hedefe en yakın</option>
          <option value="name">Ada göre</option>
        </select>

        <span className="text-[13.5px] text-zinc-500">
          {visible.length} ürün
        </span>

        <div className="ml-auto inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-[3px]">
          {(
            [
              ["cards", "grid", "Kart görünümü"],
              ["list", "list", "Liste görünümü"],
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
      </div>

      {visible.length === 0 ? (
        <div className="mt-3.5 rounded-[20px] border border-zinc-800 bg-zinc-900 px-5 py-10 text-center text-zinc-500">
          Aramana uyan ürün bulunamadı.
        </div>
      ) : view === "cards" ? (
        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
          {visible.map((item, i) => (
            <div
              key={item.id}
              className="ad-in"
              style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
            >
              <PortalProductCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3.5 overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900">
          <div className="hidden border-b border-zinc-800 px-[18px] py-2.5 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-zinc-500 sm:grid sm:grid-cols-[1.6fr_110px_130px_150px_60px] sm:gap-3.5">
            <span>Ürün</span>
            <span>Fiyat</span>
            <span>Değişim</span>
            <span>Hedef</span>
            <span />
          </div>
          {visible.map((item) => (
            <ListRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}