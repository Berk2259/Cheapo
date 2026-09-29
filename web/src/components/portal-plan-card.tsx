import Link from "next/link";
import { AdminIcon } from "@/components/admin-icons";
import { UsageMeter } from "@/components/usage-meter";
import { PLAN_LIMITS } from "@/lib/plan-limits";

// Ücretsiz ve Premium müşteri için farklı görünen plan kartı.
export function PortalPlanCard({
  plan,
  categories,
  products,
}: {
  plan: string;
  categories: number;
  products: number;
}) {
  if (plan === "premium") {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-amber-400/35 bg-[linear-gradient(135deg,#1c1a0d,#101e1d_60%)] p-5">
        <div className="pointer-events-none absolute -right-14 -top-14 h-[220px] w-[220px] bg-[radial-gradient(circle,rgba(251,191,36,0.3),transparent_65%)]" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[12.5px] font-extrabold text-amber-300">
              <AdminIcon name="crown" size={13} stroke={2.4} /> Premium
            </span>
            <b className="text-base">Sınırsız takip</b>
          </div>
          <p className="mt-1.5 text-sm text-zinc-500">
            Kategori ve ürün sınırın yok, istediğin kadar takip edebilirsin.
          </p>

          <div className="mt-3.5 grid grid-cols-3 gap-2.5">
            {[
              { value: String(products), label: "ürün takipte" },
              { value: String(categories), label: "kategori" },
              { value: "∞", label: "sınır" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-[14px] border border-zinc-800 bg-white/[0.04] px-3 py-2.5"
              >
                <b className="block text-[22px] tracking-[-0.02em]">{s.value}</b>
                <small className="text-xs text-zinc-500">{s.label}</small>
              </div>
            ))}
          </div>

          <div className="mt-3.5 border-t border-amber-400/20 pt-3.5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[11px] bg-amber-400/15 text-amber-300">
                <AdminIcon name="help" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm">Öncelikli destek</b>
                <small className="text-zinc-500">
                  Bir sorunda önce sana bakarız.
                </small>
              </span>
            </div>
            {/* Şimdilik sadece görünüm: destek kanalı belirlenince bağlanacak. */}
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-4 py-2.5 text-sm font-extrabold text-[#3b2a00] shadow-[0_10px_24px_-10px_#f59e0b] transition hover:-translate-y-0.5"
            >
              <AdminIcon name="help" size={16} /> Destek al
            </button>
          </div>
        </div>
      </div>
    );
  }

  const limits = PLAN_LIMITS.free;
  const full = products >= limits.maxProducts;

  return (
    <div className="rounded-[20px] border border-zinc-800 bg-zinc-900 p-[18px]">
      <div className="flex items-center gap-2.5">
        <b className="text-base">Planın</b>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[12.5px] font-extrabold text-emerald-300">
          Ücretsiz
        </span>
        {full && (
          <span className="ml-auto text-[13px] font-extrabold text-amber-300">
            Limit doldu
          </span>
        )}
      </div>
      <UsageMeter label="Kategori" used={categories} max={limits.maxCategories} />
      <UsageMeter label="Ürün" used={products} max={limits.maxProducts} />
      <div className="mt-3.5 flex flex-wrap items-center gap-3">
        <Link
          href="/portal/plan"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-3 py-1.5 text-[13px] font-extrabold text-[#3b2a00] transition hover:-translate-y-0.5"
        >
          <AdminIcon name="crown" size={15} /> Premium&apos;u incele
        </Link>
        <span className="text-[13px] text-zinc-500">
          Sınırsız takip ve öncelikli destek.
        </span>
      </div>
    </div>
  );
}