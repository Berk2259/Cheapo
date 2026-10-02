"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import { PriceAreaChart } from "@/components/price-area-chart";
import { toggleFavorite } from "@/app/portal/actions";

export type PortalProduct = {
  id: number;
  subscriptionId: number;
  name: string;
  category: string;
  source: string;
  url: string;
  currentPrice: number | null;
  currency: string;
  lastChecked: string;
  targetPrice: number | null;
  notifyAny: boolean;
  isFavorite: boolean;
  series: number[];
};

function money(value: number, currency: string) {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function pct(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

export function PortalProductCard({ item }: { item: PortalProduct }) {
  const { series } = item;
  const [favorite, setFavorite] = useState(item.isFavorite);
  const [, startTransition] = useTransition();

  function toggleStar() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleFavorite(item.subscriptionId, next);
      if (!result.ok) setFavorite(!next);
    });
  }

  // Son 7 kayıttaki değişim (%).
  let change: number | null = null;
  if (series.length >= 2) {
    const start = series[Math.max(0, series.length - 7)];
    const end = series[series.length - 1];
    change = start > 0 ? ((end - start) / start) * 100 : null;
  }

  const gap =
    item.targetPrice !== null && item.currentPrice !== null
      ? ((item.currentPrice - item.targetPrice) / item.targetPrice) * 100
      : null;
  const below = gap !== null && gap <= 0;
  const progress =
    item.targetPrice !== null && item.currentPrice !== null
      ? below
        ? 100
        : Math.max(6, Math.min(100, (item.targetPrice / item.currentPrice) * 100))
      : 0;

  return (
    <div
      className={
        "relative rounded-[20px] border bg-zinc-900 p-[18px] transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-[0_18px_38px_-20px_rgba(45,212,191,0.6)] " +
        (below ? "border-green-400/50" : "border-zinc-800")
      }
    >
      <button
        type="button"
        onClick={toggleStar}
        aria-label={favorite ? "Favoriden çıkar" : "Favoriye ekle"}
        title={favorite ? "Favoriden çıkar" : "Favoriye ekle"}
        className={
          "absolute right-[18px] top-[18px] grid h-8 w-8 place-items-center rounded-[9px] transition " +
          (favorite
            ? "bg-amber-400/15 text-amber-300"
            : "bg-white/5 text-zinc-500 hover:text-amber-300")
        }
      >
        <AdminIcon name="star" size={15} />
      </button>

      <div className="pr-9">
        {(item.category || item.source) && (
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide">
            {item.category && <span className="text-emerald-400">{item.category}</span>}
            {item.category && item.source && (
              <span className="text-zinc-700">/</span>
            )}
            {item.source && <span className="text-zinc-400">{item.source}</span>}
          </p>
        )}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold leading-snug text-zinc-50 transition hover:text-emerald-400"
        >
          {item.name}
        </a>
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em]">
            {item.currentPrice !== null
              ? money(item.currentPrice, item.currency)
              : "Henüz kontrol edilmedi"}
          </p>
          {change !== null &&
            (Math.abs(change) < 0.05 ? (
              <span className="mt-1.5 inline-flex rounded-full bg-zinc-800 px-2.5 py-0.5 text-[12.5px] font-extrabold text-zinc-400">
                değişmedi
              </span>
            ) : (
              <span
                className={
                  "mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12.5px] font-extrabold " +
                  (change < 0
                    ? "bg-green-400/15 text-green-400"
                    : "bg-red-400/15 text-red-400")
                }
              >
                {change < 0 ? "↓" : "↑"} %{pct(change)}
                <span className="font-semibold opacity-80">son 7 kayıt</span>
              </span>
            ))}
        </div>
        <PriceAreaChart id={item.id} points={series} />
      </div>

      {series.length >= 2 && (
        <div className="mt-2 flex justify-between text-[11.5px] text-zinc-500">
          <span>En düşük {money(Math.min(...series), item.currency)}</span>
          <span>En yüksek {money(Math.max(...series), item.currency)}</span>
        </div>
      )}

      {item.targetPrice !== null && gap !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-[12.5px] font-bold">
            <span className={below ? "text-green-400" : "text-zinc-50"}>
              {below ? "Hedefin altında ✓" : `Hedefe %${pct(gap)} uzak`}
            </span>
            <span className="text-zinc-500">
              Hedef {money(item.targetPrice, item.currency)}
            </span>
          </div>
          <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-zinc-800">
            <div
              className={
                "ad-grow h-full rounded-full " +
                (below
                  ? "bg-[linear-gradient(90deg,#22c55e,#4ade80)]"
                  : "bg-[linear-gradient(90deg,#2dd4bf,#5eead4)]")
              }
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {item.notifyAny && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
            Her değişimde bildir
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 text-[12.5px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <AdminIcon name="clock" size={13} /> {item.lastChecked}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-extrabold text-emerald-500 transition-all hover:gap-2 hover:text-emerald-400"
        >
          Mağazada aç <AdminIcon name="external" size={13} />
        </a>
      </div>
    </div>
  );
}