"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import {
  approvePremiumRequest,
  rejectPremiumRequest,
} from "@/app/admin/premium-requests/actions";

export type PremiumRequestItem = {
  id: number;
  customerId: number;
  customerName: string;
  plan: string;
  bound: boolean;
  phone: string | null;
  note: string | null;
  status: string;
  ago: string;
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  bekliyor: { text: "Bekliyor", cls: "bg-amber-400/15 text-amber-300" },
  onaylandi: { text: "Onaylandı", cls: "bg-emerald-500/15 text-emerald-400" },
  reddedildi: { text: "Reddedildi", cls: "bg-red-400/15 text-red-400" },
};

export function PremiumRequestsList({ items }: { items: PremiumRequestItem[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function approve(item: PremiumRequestItem) {
    const ok = confirm(`"${item.customerName}" Premium yapılsın mı?`);
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await approvePremiumRequest(item.id, item.customerId);
      if (!result.ok) setError(result.message ?? "Onaylanamadı.");
    });
  }

  function reject(item: PremiumRequestItem) {
    const ok = confirm(
      `"${item.customerName}" talebini reddetmek istediğine emin misin?`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectPremiumRequest(item.id);
      if (!result.ok) setError(result.message ?? "Reddedilemedi.");
    });
  }

  return (
    <div className="mt-6 grid gap-3">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 px-[18px] py-4"
        >
          <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-zinc-800 text-base font-extrabold text-zinc-400">
            {(item.customerName.trim()[0] ?? "?").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <b className="text-[15px] text-zinc-50">{item.customerName}</b>
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-extrabold text-zinc-400">
                {item.plan === "premium" ? "Premium" : "Ücretsiz"}
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-zinc-500">
              {item.ago} talep etti ·{" "}
              {item.bound ? "Telegram bağlı" : "Telegram bağlı değil"}
            </p>
            {(item.phone || item.note) && (
              <p className="mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[12.5px] text-zinc-400">
                {item.phone && <>📞 {item.phone}</>}
                {item.phone && item.note && " · "}
                {item.note}
              </p>
            )}
          </div>
          <div className="flex flex-none gap-2">
            {item.status === "bekliyor" ? (
              <>
                <button
                  type="button"
                  onClick={() => reject(item)}
                  disabled={pending}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-[13px] font-extrabold text-zinc-300 transition hover:border-zinc-600 disabled:opacity-50"
                >
                  Reddet
                </button>
                <button
                  type="button"
                  onClick={() => approve(item)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-[13px] font-extrabold text-[#3b2a00] transition hover:bg-amber-300 disabled:opacity-50"
                >
                  <AdminIcon name="crown" size={14} />
                  Onayla, Premium yap
                </button>
              </>
            ) : (
              <span
                className={
                  "rounded-full px-3 py-1.5 text-[13px] font-extrabold " +
                  (STATUS_LABEL[item.status]?.cls ?? "bg-zinc-800 text-zinc-400")
                }
              >
                {STATUS_LABEL[item.status]?.text ?? item.status}
              </span>
            )}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
          Bekleyen Premium talebi yok.
        </div>
      )}
    </div>
  );
}