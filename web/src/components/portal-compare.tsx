"use client";

import { useState } from "react";
import { AdminIcon } from "@/components/admin-icons";

export type CompareRow = {
  id: number;
  name: string;
  source: string;
  price: number | null;
  currency: string;
  url: string;
  lastChecked: string;
  mine: boolean;
};

export type CompareGroup = { key: string; category: string; rows: CompareRow[] };
export type SoloProduct = { id: number; name: string; source: string };

function money(value: number, currency: string) {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function pct(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

export function PortalCompare({
  groups,
  solo,
  lastUpdated,
}: {
  groups: CompareGroup[];
  solo: SoloProduct[];
  lastUpdated: string;
}) {
  // Her grup için: en ucuz ve en pahalı satır, aradaki fark.
  const analysed = groups.map((g) => {
    const priced = g.rows.filter((r) => r.price !== null);
    const sorted = [...g.rows].sort(
      (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    );
    const cheapest = priced.length
      ? priced.reduce((a, b) => ((b.price as number) < (a.price as number) ? b : a))
      : null;
    const priciest = priced.length
      ? priced.reduce((a, b) => ((b.price as number) > (a.price as number) ? b : a))
      : null;
    const spread =
      cheapest && priciest
        ? (priciest.price as number) - (cheapest.price as number)
        : 0;
    const spreadPct =
      cheapest && spread > 0 ? (spread / (cheapest.price as number)) * 100 : 0;
    // Satırlarda marketler farklıysa market adını, aynı market ise ürün adını başlık yap.
    const showMarket = new Set(g.rows.map((r) => r.source)).size > 1;
    const nameCounts = new Map<string, number>();
    for (const r of g.rows) nameCounts.set(r.name, (nameCounts.get(r.name) ?? 0) + 1);
    const title =
      [...nameCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? g.key;
    return { g, sorted, cheapest, spread, spreadPct, showMarket, title };
  });

  const CATEGORY_FALLBACK = "Diğer";

  function slugify(key: string) {
    return key.toLocaleLowerCase("tr").replace(/[^a-z0-9]+/g, "-");
  }

  function scrollToCategory(key: string | null) {
    const id = key ? `compare-cat-${slugify(key)}` : "compare-top";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const categoryCounts = new Map<string, number>();
  for (const a of analysed) {
    const key = a.g.category || CATEGORY_FALLBACK;
    categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
  }
  const categoryPills = [
    { key: null as string | null, label: "Tümü", count: analysed.length },
    ...[...categoryCounts.entries()].map(([key, count]) => ({ key: key as string | null, label: key, count })),
  ];
  const sections = [...categoryCounts.keys()].map((key) => ({
    key,
    items: analysed.filter((a) => (a.g.category || CATEGORY_FALLBACK) === key),
  }));

  const GROUPS_PER_PAGE = 5;
  const [pages, setPages] = useState<Record<string, number>>({});

  function pageFor(key: string) {
    return pages[key] ?? 1;
  }
  function setPageFor(key: string, value: number) {
    setPages((prev) => ({ ...prev, [key]: value }));
  }

  const currency = groups[0]?.rows[0]?.currency ?? "TRY";

  const biggest = analysed.reduce(
    (best, a) => (a.spread > best.spread ? a : best),
    analysed[0],
  );
  const avgPct = analysed.length
    ? analysed.reduce((s, a) => s + a.spreadPct, 0) / analysed.length
    : 0;

  const totalSavings = analysed.reduce((sum, a) => sum + a.spread, 0);

  const tiles = [
    {
      label: "Karşılaştırılan",
      value: String(groups.length),
      text: "ürün marketlerde kıyaslanıyor",
      icon: "scale" as const,
      tone: "bg-emerald-500/15 text-emerald-400",
    },
    {
      label: "Toplam kazanç",
      value: money(totalSavings, currency),
      text: "her üründe en ucuzu seçersen",
      icon: "coin" as const,
      tone: "bg-green-400/15 text-green-400",
    },
    {
      label: "En büyük fark",
      value: money(biggest?.spread ?? 0, currency),
      text: biggest?.title ?? "-",
      icon: "coin" as const,
      tone: "bg-green-400/15 text-green-400",
    },
    {
      label: "Ortalama fark",
      value: `%${pct(avgPct)}`,
      text: "en ucuz ile en pahalı market arası",
      icon: "trend" as const,
      tone: "bg-amber-400/15 text-amber-300",
    },
    {
      label: "Son güncelleme",
      value: lastUpdated,
      text: "bot fiyatları düzenli kontrol eder",
      icon: "clock" as const,
      tone: "bg-emerald-500/15 text-emerald-400",
    },
  ];

  return (
    <div>
      <div className="ad-in">
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">
          Satıcılar arası fiyat kıyaslama
        </h1>
        <p className="mt-0.5 text-zinc-500">
          Takip ettiğin ürünlerin farklı satıcılardaki fiyatları.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="mt-5 rounded-[20px] border-2 border-dashed border-zinc-800 px-5 py-12 text-center text-zinc-500">
          Takip ettiğin ürünler için henüz market karşılaştırması eklenmemiş.
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
            {tiles.map((t, i) => (
              <div
                key={t.label}
                className="ad-in rounded-[20px] border border-zinc-800 bg-zinc-900 px-[18px] py-4 transition hover:-translate-y-[3px] hover:border-emerald-500"
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className="flex items-center gap-2.5 text-[13.5px] font-bold text-zinc-500">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-[9px] ${t.tone}`}
                  >
                    <AdminIcon name={t.icon} size={16} />
                  </span>
                  {t.label}
                </div>
                <div className="mt-2 text-[24px] font-extrabold leading-[1.15] tracking-[-0.03em]">
                  {t.value}
                </div>
                <div className="mt-0.5 truncate text-[12.5px] font-bold text-zinc-500">
                  {t.text}
                </div>
              </div>
            ))}
          </div>

          <div id="compare-top" className="mt-4 flex flex-wrap gap-2.5">
            {categoryPills.map((p) => (
              <button
                key={p.key ?? "all"}
                type="button"
                onClick={() => scrollToCategory(p.key)}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-[13.5px] font-extrabold text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400"
              >
                {p.label}
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11.5px] font-extrabold text-zinc-400">
                  {p.count}
                </span>
              </button>
            ))}
          </div>

          {sections.map((section) => {
            const totalPages = Math.max(1, Math.ceil(section.items.length / GROUPS_PER_PAGE));
            const page = Math.min(pageFor(section.key), totalPages);
            const pageItems = section.items.slice(
              (page - 1) * GROUPS_PER_PAGE,
              page * GROUPS_PER_PAGE,
            );
            return (
            <div key={section.key} id={`compare-cat-${slugify(section.key)}`} className="mt-6">
              <div className="mb-2.5 flex items-center gap-2.5 border-b border-zinc-800 pb-2.5">
                <b className="text-base">{section.key}</b>
                <span className="text-[12.5px] font-bold text-zinc-500">
                  {section.items.length} ürün grubu
                </span>
              </div>

              {pageItems.map(
                ({ g, sorted, cheapest, spread, spreadPct, showMarket, title }, gi) => (
                  <div
                    key={g.key}
                    className="ad-in mt-4 overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900"
                    style={{ "--i": Math.min(gi + 4, 10) } as React.CSSProperties}
                  >
                    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-[18px] py-4">
                      <b className="text-base">{title}</b>
                      <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[11.5px] font-extrabold text-emerald-300">
                        {g.rows.length} {showMarket ? "market" : "ürün"}
                      </span>
                      {cheapest && spread > 0.001 ? (
                        <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-green-400/15 px-3 py-1 text-[13px] font-extrabold text-green-400">
                          <AdminIcon name="coin" size={14} />
                          {showMarket ? cheapest.source : cheapest.name} en ucuz ·{" "}
                          {money(spread, cheapest.currency)} fark (%{pct(spreadPct)})
                        </span>
                      ) : (
                        <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1 text-[13px] font-extrabold text-zinc-400">
                          Fiyatlar aynı
                        </span>
                      )}
                    </div>

                    {sorted.map((r) => {
                      const isCheapest = cheapest !== null && r.id === cheapest.id;
                      const diff =
                        cheapest && r.price !== null
                          ? ((r.price - (cheapest.price as number)) /
                            (cheapest.price as number)) *
                          100
                          : 0;
                      const barWidth =
                        cheapest && r.price !== null
                          ? Math.max(8, ((cheapest.price as number) / r.price) * 100)
                          : 0;
                      return (
                        <div
                          key={r.id}
                          className="grid items-center gap-3.5 border-t border-zinc-800 px-[18px] py-3 transition-colors first-of-type:border-t-0 hover:bg-emerald-500/10 sm:grid-cols-[1.4fr_130px_170px_100px_60px]"
                        >
                          <div className="min-w-0">
                            <b className="block font-extrabold">
                              {showMarket ? r.source || r.name : r.name}
                            </b>
                            {showMarket && (
                              <small className="text-zinc-500">{r.name}</small>
                            )}
                            {!showMarket && r.source && (
                              <small className="text-zinc-500">{r.source}</small>
                            )}
                          </div>

                          <div
                            className={
                              "text-[17px] font-extrabold tabular-nums " +
                              (isCheapest ? "text-green-400" : "")
                            }
                          >
                            {r.price !== null ? money(r.price, r.currency) : "—"}
                          </div>

                          <div>
                            {r.price === null ? (
                              <span className="text-[13px] text-zinc-500">
                                Henüz kontrol edilmedi
                              </span>
                            ) : (
                              <>
                                {isCheapest ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-400/15 px-2.5 py-0.5 text-xs font-extrabold text-green-400">
                                    <AdminIcon name="check" size={12} stroke={3.2} />
                                    En ucuz
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-red-400/15 px-2.5 py-0.5 text-xs font-extrabold text-red-400">
                                    +%{pct(diff)} daha pahalı
                                  </span>
                                )}
                                <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-zinc-800">
                                  <div
                                    className={
                                      "ad-grow h-full rounded-full " +
                                      (isCheapest
                                        ? "bg-[linear-gradient(90deg,#22c55e,#4ade80)]"
                                        : "bg-[linear-gradient(90deg,#2dd4bf,#5eead4)]")
                                    }
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <div className="text-[13px] text-zinc-500">
                            {r.lastChecked}
                          </div>

                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-extrabold text-emerald-500 transition-all hover:gap-2 hover:text-emerald-400 sm:justify-end"
                          >
                            Aç <AdminIcon name="external" size={13} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ),
              )}

              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 text-[12.5px] text-zinc-500">
                  <span>
                    {(page - 1) * GROUPS_PER_PAGE + 1}–
                    {Math.min(page * GROUPS_PER_PAGE, section.items.length)} /{" "}
                    {section.items.length} ürün grubu
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPageFor(section.key, Math.max(1, page - 1))}
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
                      onClick={() => setPageFor(section.key, Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-40"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </>
      )}

      {solo.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-3 border-b border-zinc-800 px-[18px] py-4">
            <b className="text-base">Karşılaştırması olmayan ürünler</b>
            <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[11.5px] font-extrabold text-zinc-400">
              {solo.length}
            </span>
          </div>
          {solo.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 border-t border-zinc-800 px-[18px] py-3 text-zinc-500 first:border-t-0"
            >
              <AdminIcon name="package" size={18} />
              <span>
                <b className="text-zinc-50">{p.name}</b>
                {p.source && ` · ${p.source}`}
                <small className="block">
                  Bu ürün için henüz başka market fiyatı eklenmedi.
                </small>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-zinc-800 bg-zinc-900 px-[18px] py-3.5 text-[13.5px] text-zinc-500">
        <AdminIcon name="help" size={20} />
        <span>
          Market karşılaştırmalarını ekibimiz ekler. Bir ürünün başka
          marketlerdeki fiyatını görmek istersen{" "}
          <b className="text-emerald-500">Talep gönder</b> sayfasından not
          bırakabilirsin.
        </span>
      </div>
    </div>
  );
}