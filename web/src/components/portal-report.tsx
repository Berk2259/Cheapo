"use client";

import { useState } from "react";
import { AdminIcon, type AdminIconName } from "@/components/admin-icons";

export type ReportProduct = {
  id: number;
  name: string;
  category: string;
  source: string;
  currency: string;
  target: number | null;
  // Son 30 günün günlük fiyatları (eskiden yeniye), boş günler doldurulmuş.
  series: number[];
};

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function dayLabel(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

function money(value: number, currency: string) {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function pct(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

function AreaChart({ values, id }: { values: number[]; id: number }) {
  const w = 800;
  const h = 190;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => 12 + (1 - (v - min) / range) * (h - 24);

  const line = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const gradient = `report-area-${id}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="mt-3.5 h-[190px] w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.35" />
          <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${gradient})`} />
      <path
        d={line}
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="2.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function PortalReport({
  days,
  products,
  notifications,
}: {
  days: string[];
  products: ReportProduct[];
  notifications: number[];
}) {
  const [period, setPeriod] = useState<7 | 30>(7);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const usable = products.filter((p) => p.series.length >= 2);

  if (usable.length === 0) {
    return (
      <div className="mt-5 rounded-[20px] border-2 border-dashed border-zinc-800 px-5 py-12 text-center text-zinc-500">
        Rapor için henüz yeterli fiyat kaydı yok. Ürünlerin fiyatı birkaç gün
        kontrol edilince burada görünecek.
      </div>
    );
  }

  const label = period === 7 ? "bu hafta" : "bu ay";
  const slice = (p: ReportProduct) => p.series.slice(-period);
  const change = (p: ReportProduct) => {
    const s = slice(p);
    return s[0] > 0 ? ((s[s.length - 1] - s[0]) / s[0]) * 100 : 0;
  };
  const current = (p: ReportProduct) => p.series[p.series.length - 1];

  const rows = usable
    .map((p) => ({ p, c: change(p) }))
    .sort((a, b) => a.c - b.c);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.c)), 1);
  const best = rows[0];
  const worst = rows[rows.length - 1];

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pageRows = rows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const withTarget = usable.filter((p) => p.target !== null);
  const below = withTarget.filter((p) => current(p) <= (p.target as number));

  const dayNotifs = notifications.slice(-period);
  const notifTotal = dayNotifs.reduce((a, b) => a + b, 0);
  const maxNotif = Math.max(...dayNotifs, 1);
  const periodDays = days.slice(-period);

  const selected = usable.find((p) => p.id === selectedId) ?? usable[0];
  const sel = slice(selected);
  const selChange = change(selected);
  const avg = sel.reduce((a, b) => a + b, 0) / sel.length;

  const insights: { icon: AdminIconName; tone: string; text: React.ReactNode }[] = [];
  if (best.c < -0.05) {
    insights.push({
      icon: "trend",
      tone: "bg-green-400/15 text-green-400",
      text: (
        <>
          <b className="text-zinc-50">{best.p.name}</b> {label}{" "}
          <b className="text-zinc-50">%{pct(best.c)}</b> ucuzladı
          {best.p.target !== null && current(best.p) <= best.p.target
            ? " ve hedef fiyatının altında."
            : "."}
        </>
      ),
    });
  }
  if (worst.c > 0.05) {
    insights.push({
      icon: "up",
      tone: "bg-red-400/15 text-red-400",
      text: (
        <>
          <b className="text-zinc-50">{worst.p.name}</b>{" "}
          <b className="text-zinc-50">%{pct(worst.c)}</b> pahalandı
          {worst.p.target !== null ? "; hedefine uzaklaştı." : "."}
        </>
      ),
    });
  }
  if (below.length > 0) {
    insights.push({
      icon: "target",
      tone: "bg-emerald-500/15 text-emerald-400",
      text: (
        <>
          <b className="text-zinc-50">{below.length} ürün</b> hedef fiyatının
          altında: {below.map((p) => p.name).join(", ")}.
        </>
      ),
    });
  }
  insights.push({
    icon: "bell",
    tone: "bg-amber-400/15 text-amber-300",
    text: (
      <>
        {label[0].toUpperCase() + label.slice(1)}{" "}
        <b className="text-zinc-50">{notifTotal} bildirim</b> aldın.
      </>
    ),
  });

  const tiles: {
    label: string;
    icon: AdminIconName;
    tone: string;
    value: React.ReactNode;
    text: React.ReactNode;
  }[] = [
    {
      label: "En çok düşen",
      icon: "trend",
      tone: "bg-green-400/15 text-green-400",
      value: <span className="text-[17px]">{best.c < -0.05 ? best.p.name : "—"}</span>,
      text: best.c < -0.05 ? <span className="text-green-400">↓ %{pct(best.c)}</span> : "düşen ürün yok",
    },
    {
      label: "En çok artan",
      icon: "up",
      tone: "bg-red-400/15 text-red-400",
      value: <span className="text-[17px]">{worst.c > 0.05 ? worst.p.name : "—"}</span>,
      text: worst.c > 0.05 ? <span className="text-red-400">↑ %{pct(worst.c)}</span> : "artan ürün yok",
    },
    {
      label: "Hedefte",
      icon: "target",
      tone: "bg-amber-400/15 text-amber-300",
      value: (
        <>
          {below.length}{" "}
          <small className="text-sm font-bold text-zinc-500">/ {withTarget.length}</small>
        </>
      ),
      text: "hedefinin altındaki ürün",
    },
    {
      label: "Bildirim",
      icon: "bell",
      tone: "bg-emerald-500/15 text-emerald-400",
      value: notifTotal,
      text: `${label} aldığın`,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div className="ad-in">
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">
            Haftalık ve aylık rapor
          </h1>
          <p className="mt-0.5 text-zinc-500">
            Takip ettiğin ürünlerin fiyatı bu dönemde nasıl değişti.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-[3px]">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPeriod(d)}
              className={
                "rounded-[9px] px-3.5 py-1.5 text-[13.5px] font-extrabold transition " +
                (period === d
                  ? "bg-emerald-500 text-[#052e2b]"
                  : "text-zinc-500 hover:text-zinc-50")
              }
            >
              Son {d} gün
            </button>
          ))}
        </div>
      </div>

      {/* Özet kutuları */}
      <div className="mt-4 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <div
            key={t.label}
            className="ad-in rounded-[20px] border border-zinc-800 bg-zinc-900 px-[18px] py-4 transition hover:-translate-y-[3px] hover:border-emerald-500"
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="flex items-center gap-2.5 text-[13.5px] font-bold text-zinc-500">
              <span className={`grid h-7 w-7 place-items-center rounded-[9px] ${t.tone}`}>
                <AdminIcon name={t.icon} size={16} />
              </span>
              {t.label}
            </div>
            <div className="mt-2 text-[26px] font-extrabold leading-[1.15] tracking-[-0.03em]">
              {t.value}
            </div>
            <div className="mt-0.5 text-[12.5px] font-bold text-zinc-500">
              {t.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[18px] grid items-start gap-[18px] lg:grid-cols-[1.5fr_1fr]">
        {/* Fiyat değişimi çubukları */}
        <div className="rounded-[20px] border border-zinc-800 bg-zinc-900 p-[18px]">
          <h3 className="mb-3 flex flex-wrap items-center gap-2 text-base font-bold">
            <AdminIcon name="trend" size={17} /> Fiyat değişimi
            <small className="hidden text-[12.5px] font-semibold text-zinc-500 sm:block">
              yeşil ucuzladı, kırmızı pahalandı
            </small>
            <span className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500">
              Sayfa başına
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[12.5px] text-zinc-50 outline-none focus:border-emerald-500"
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </span>
          </h3>
          <div className="flex justify-between px-1.5 pb-1.5 text-[11.5px] text-zinc-500 sm:pl-[182px]">
            <span>← ucuzladı</span>
            <span>pahalandı →</span>
          </div>
          {pageRows.map(({ p, c }) => {
            const flat = Math.abs(c) < 0.05;
            const width = (Math.abs(c) / maxAbs) * 50;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={
                  "grid w-full grid-cols-[110px_1fr_62px] items-center gap-3 rounded-xl px-1.5 py-2.5 text-left transition hover:bg-emerald-500/10 sm:grid-cols-[170px_1fr_74px] " +
                  (p.id === selected.id
                    ? "bg-emerald-500/10 shadow-[inset_3px_0_0_#2dd4bf]"
                    : "")
                }
              >
                <span className="text-[13.5px] font-bold leading-tight">
                  {p.name}
                  <small className="block text-xs font-medium text-zinc-500">
                    {p.category}
                    {p.category && p.source && " · "}
                    {p.source}
                  </small>
                </span>
                <span className="relative h-3 overflow-hidden rounded-full bg-zinc-800">
                  <span className="absolute inset-y-0 left-1/2 z-10 w-0.5 bg-zinc-950" />
                  {!flat && (
                    <i
                      className={
                        "ad-grow absolute inset-y-0 rounded-full " +
                        (c < 0
                          ? "right-1/2 bg-[linear-gradient(270deg,#22c55e,#4ade80)]"
                          : "left-1/2 bg-[linear-gradient(90deg,#f87171,#ef4444)]")
                      }
                      style={{
                        width: `${width}%`,
                        transformOrigin: c < 0 ? "right" : "left",
                      }}
                    />
                  )}
                </span>
                <span
                  className={
                    "text-right font-extrabold tabular-nums " +
                    (flat ? "text-zinc-500" : c < 0 ? "text-green-400" : "text-red-400")
                  }
                >
                  {flat ? "—" : `${c < 0 ? "↓" : "↑"} %${pct(c)}`}
                </span>
              </button>
            );
          })}

          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-3 text-[12.5px] text-zinc-500">
              <span>
                {(page - 1) * rowsPerPage + 1}–
                {Math.min(page * rowsPerPage, rows.length)} / {rows.length} ürün
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-40"
                >
                  ‹
                </button>
                <span className="px-1 font-bold text-zinc-300">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sağ: bildirimler ve öne çıkanlar */}
        <div className="grid gap-[18px]">
          <div className="rounded-[20px] border border-zinc-800 bg-zinc-900 p-[18px]">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
              <AdminIcon name="bell" size={17} /> Bildirimler
              <small className="ml-auto text-[12.5px] font-semibold text-zinc-500">
                {notifTotal} toplam
              </small>
            </h3>
            <div className="flex h-[90px] items-end gap-1">
              {dayNotifs.map((v, i) => (
                <div
                  key={i}
                  title={`${dayLabel(periodDays[i])}: ${v} bildirim`}
                  className="min-h-[3px] flex-1 rounded-t bg-[linear-gradient(180deg,#2dd4bf,transparent)]"
                  style={{ height: `${Math.max(4, (v / maxNotif) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[11.5px] text-zinc-500">
              <span>{dayLabel(periodDays[0])}</span>
              <span>Bugün</span>
            </div>
          </div>

          <div className="rounded-[20px] border border-zinc-800 bg-zinc-900 p-[18px]">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
              <AdminIcon name="spark" size={17} /> Öne çıkanlar
            </h3>
            <div className="grid gap-2.5">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-[14px] border border-zinc-800 bg-white/[0.03] px-3.5 py-3 text-sm text-zinc-400"
                >
                  <span
                    className={`grid h-7 w-7 flex-none place-items-center rounded-[9px] ${ins.tone}`}
                  >
                    <AdminIcon name={ins.icon} size={15} />
                  </span>
                  <span>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seçili ürün detayı */}
      <div className="mt-[18px] rounded-[20px] border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex flex-wrap items-start gap-3.5">
          <div>
            <h4 className="text-lg font-bold">{selected.name}</h4>
            <small className="text-zinc-500">
              {selected.category}
              {selected.category && selected.source && " · "}
              {selected.source} · son {period} gün
            </small>
          </div>
          <span
            className={
              "ml-auto rounded-full px-3 py-0.5 text-[13.5px] font-extrabold " +
              (Math.abs(selChange) < 0.05
                ? "bg-zinc-800 text-zinc-400"
                : selChange < 0
                  ? "bg-green-400/15 text-green-400"
                  : "bg-red-400/15 text-red-400")
            }
          >
            {Math.abs(selChange) < 0.05
              ? "değişmedi"
              : `${selChange < 0 ? "↓" : "↑"} %${pct(selChange)}`}
          </span>
        </div>

        <AreaChart values={sel} id={selected.id} />
        <div className="mt-1.5 flex justify-between text-[11.5px] text-zinc-500">
          <span>{dayLabel(periodDays[0])}</span>
          <span>Bugün</span>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {[
            ["Başlangıç", money(sel[0], selected.currency), ""],
            ["Şimdi", money(sel[sel.length - 1], selected.currency), ""],
            ["En düşük", money(Math.min(...sel), selected.currency), "text-green-400"],
            ["En yüksek", money(Math.max(...sel), selected.currency), "text-red-400"],
            ["Ortalama", money(avg, selected.currency), ""],
          ].map(([k, v, cls]) => (
            <div
              key={k}
              className="rounded-[14px] border border-zinc-800 bg-white/[0.03] px-3 py-2.5"
            >
              <small className="text-xs text-zinc-500">{k}</small>
              <b className={`block text-[17px] tabular-nums tracking-[-0.01em] ${cls}`}>
                {v}
              </b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}