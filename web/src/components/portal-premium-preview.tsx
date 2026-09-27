import Link from "next/link";
import { AdminIcon, type AdminIconName } from "@/components/admin-icons";

type Kind = "reports" | "compare" | "basket";

const info: Record<Kind, { title: string; text: string; icon: AdminIconName }> = {
  reports: {
    title: "Haftalık ve aylık rapor",
    text: "Takip ettiğin ürünlerin fiyatı hafta ve ay boyunca nasıl değişti: en çok düşenler, hedefe yaklaşanlar ve bildirim özeti.",
    icon: "chart",
  },
  compare: {
    title: "Satıcılar arası fiyat kıyaslama",
    text: "Aynı ürünü farklı satıcılarda yan yana gör, en ucuzunu hemen fark et.",
    icon: "scale",
  },
  basket: {
    title: "Alışveriş listesi",
    text: "Market ürünlerini işaretle, hangi marketin toplamda en ucuza geldiğini anında gör.",
    icon: "cart",
  },
};

const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const heights = [30, 55, 40, 80, 60, 95, 70];

// Örnek görünüm: gerçek veri değil, yalnızca ne göreceğini anlatır.
function ReportsMock() {
  return (
    <div className="rounded-[20px] border border-zinc-800 bg-zinc-900 p-[18px]">
      <div className="grid grid-cols-3 gap-2.5">
        {[
          ["−%12", "en çok düşen ürün"],
          ["7", "bu hafta bildirim"],
          ["3", "hedefe yaklaşan"],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-[14px] border border-zinc-800 bg-white/[0.04] px-3 py-2.5"
          >
            <b className="block text-[22px]">{value}</b>
            <small className="text-xs text-zinc-500">{label}</small>
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex h-[140px] items-end gap-2.5 px-1 py-2">
        {days.map((d, i) => (
          <div
            key={d}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5 text-[11px] text-zinc-500"
          >
            <i
              className="w-full rounded-t-lg bg-[linear-gradient(180deg,#2dd4bf,transparent)]"
              style={{ height: `${heights[i]}%` }}
            />
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

function BasketMock() {
  const rows = [
    ["Coca-Cola 1,5 L", "50,00", "46,50", "—", 1],
    ["Dido Sütlü Çikolata", "27,50", "29,90", "—", 0],
    ["Şampuan 500 ml", "89,90", "84,90", "92,00", 1],
  ] as const;
  return (
    <div className="overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-3.5 py-2.5"></th>
            <th className="px-3.5 py-2.5 font-bold">Ürün</th>
            <th className="px-3.5 py-2.5 font-bold">Migros</th>
            <th className="px-3.5 py-2.5 font-bold">CarrefourSA</th>
            <th className="px-3.5 py-2.5 font-bold">Trendyol</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-zinc-800 last:border-0">
              <td className="px-3.5 py-3">
                <span className="block h-[16px] w-[16px] rounded-[5px] bg-emerald-500" />
              </td>
              <td className="px-3.5 py-3 font-bold">{r[0]}</td>
              {[1, 2, 3].map((n) => (
                <td
                  key={n}
                  className={
                    "px-3.5 py-3 tabular-nums " +
                    (r[4] === n - 1 ? "font-extrabold text-green-400" : "")
                  }
                >
                  {r[n]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompareMock() {
  const rows = [
    ["Ürün A", "80,00", "74,90", "82,50", 1],
    ["Ürün B", "50,00", "52,00", "55,90", 0],
    ["Ürün C", "27,50", "26,90", "25,00", 2],
  ] as const;
  return (
    <div className="overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-3.5 py-2.5 font-bold">Ürün</th>
            <th className="px-3.5 py-2.5 font-bold">Mağaza 1</th>
            <th className="px-3.5 py-2.5 font-bold">Mağaza 2</th>
            <th className="px-3.5 py-2.5 font-bold">Mağaza 3</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-zinc-800 last:border-0">
              <td className="px-3.5 py-3 font-bold">{r[0]}</td>
              {[1, 2, 3].map((n) => (
                <td
                  key={n}
                  className={
                    "px-3.5 py-3 tabular-nums " +
                    (r[4] === n - 1 ? "font-extrabold text-green-400" : "")
                  }
                >
                  {r[n]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PortalPremiumPreview({
  kind,
  premium,
}: {
  kind: Kind;
  premium: boolean;
}) {
  const { title, text, icon } = info[kind];

  return (
    <div>
      <div className="ad-in">
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">
          {title}{" "}
          <span className="ml-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-0.5 align-middle text-xs font-extrabold text-amber-300">
            {premium ? (
              "Yakında"
            ) : (
              <>
                <AdminIcon name="lock" size={12} stroke={2.6} /> Premium
              </>
            )}
          </span>
        </h1>
        <p className="mt-1 text-zinc-500">{text}</p>
      </div>

      <div
        className="ad-in relative mt-4 overflow-hidden rounded-[20px]"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <div
          className={
            "pointer-events-none select-none " +
            (premium ? "opacity-35" : "opacity-75 blur-[5px]")
          }
        >
          {kind === "reports" ? (
            <ReportsMock />
          ) : kind === "basket" ? (
            <BasketMock />
          ) : (
            <CompareMock />
          )}
        </div>

        <div
          className={
            "absolute inset-0 grid place-items-center p-5 text-center " +
            (premium
              ? ""
              : "bg-[linear-gradient(180deg,rgba(10,20,19,0.25),rgba(10,20,19,0.8))]")
          }
        >
          <div>
            <span className="mx-auto mb-3 grid h-[54px] w-[54px] place-items-center rounded-[18px] bg-amber-400/15 text-amber-300">
              <AdminIcon name={premium ? icon : "lock"} size={26} />
            </span>
            <h3 className="text-xl font-bold">
              {premium ? "Bu özellik hazırlanıyor" : "Premium ile açılır"}
            </h3>
            <p className="mx-auto mb-3.5 mt-1 max-w-[380px] text-zinc-400">
              {premium
                ? "Premium planında olduğun için hazır olduğunda burada göreceksin. Arkadaki görünüm sadece örnektir."
                : "Bu özellik Premium planına dahil. Arkadaki görünüm sadece örnektir."}
            </p>
            {!premium && (
              <Link
                href="/portal/plan"
                className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-4 py-2.5 font-extrabold text-[#3b2a00] shadow-[0_10px_24px_-10px_#f59e0b] transition hover:-translate-y-0.5"
              >
                <AdminIcon name="crown" size={16} /> Premium&apos;u incele
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}