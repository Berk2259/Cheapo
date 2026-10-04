"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import { confirmRemoval, rejectRemoval } from "@/app/admin/removal-requests/actions";

export type RemovalItem = {
  id: number;
  name: string;
  plan: string;
  bound: boolean;
  joined: string;
  requestedAgo: string;
  productCount: number;
  notifCount: number;
};

export function RemovalRequestsList({ items }: { items: RemovalItem[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(items[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const q = query.trim().toLocaleLowerCase("tr");
  const visible = items.filter(
    (i) => !q || i.name.toLocaleLowerCase("tr").includes(q),
  );

  function reject(id: number, name: string) {
    const ok = confirm(
      `"${name}" müşterisinin kaldırma talebini reddetmek istediğine emin misin?`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectRemoval(id);
      if (!result.ok) setError(result.message ?? "Reddedilemedi.");
    });
  }

  function confirmDelete(id: number, name: string) {
    const ok = confirm(
      `"${name}" müşterisinin hesabını kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmRemoval(id);
      if (!result.ok) setError(result.message ?? "Silinemedi.");
    });
  }

  return (
    <div className="mt-6">
      <label className="flex min-w-[260px] max-w-sm items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-500 transition focus-within:border-emerald-500 focus-within:shadow-[0_0_0_4px_rgba(45,212,191,0.13)]">
        <AdminIcon name="search" size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Müşteri ara…"
          className="w-full bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
        />
      </label>

      <div className="mt-4 grid gap-3">
        {visible.map((item) => {
          const open = openId === item.id;
          return (
            <div
              key={item.id}
              className={
                "overflow-hidden rounded-2xl border bg-zinc-900 transition-colors " +
                (open ? "border-red-500" : "border-zinc-800")
              }
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center gap-4 px-[18px] py-4 text-left"
              >
                <span
                  className={
                    "grid h-10 w-10 flex-none place-items-center rounded-full text-base font-extrabold " +
                    (item.plan === "premium"
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-emerald-500/15 text-emerald-400")
                  }
                >
                  {(item.name.trim()[0] ?? "?").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <b className="text-[15px] text-zinc-50">{item.name}</b>
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-xs font-extrabold " +
                        (item.plan === "premium"
                          ? "bg-amber-400/15 text-amber-300"
                          : "bg-zinc-800 text-zinc-400")
                      }
                    >
                      {item.plan === "premium" ? "Premium" : "Ücretsiz"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-zinc-500">
                    {item.requestedAgo} talep etti
                  </p>
                </div>
                <span
                  className={
                    "grid h-8 w-8 flex-none place-items-center rounded-lg bg-zinc-800/60 text-zinc-400 transition-transform " +
                    (open ? "rotate-90" : "")
                  }
                >
                  <AdminIcon name="arrow" size={15} />
                </span>
              </button>

              {open && (
                <div className="px-[18px] pb-[18px]">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                      <small className="text-xs text-zinc-500">Takip edilen ürün</small>
                      <b className="mt-0.5 block text-base">{item.productCount}</b>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                      <small className="text-xs text-zinc-500">Telegram</small>
                      <b
                        className={
                          "mt-0.5 block text-base " +
                          (item.bound ? "text-emerald-400" : "text-red-400")
                        }
                      >
                        {item.bound ? "Bağlı" : "Bağlı değil"}
                      </b>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                      <small className="text-xs text-zinc-500">Üyelik tarihi</small>
                      <b className="mt-0.5 block text-base">{item.joined}</b>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                      <small className="text-xs text-zinc-500">Aldığı bildirim</small>
                      <b className="mt-0.5 block text-base">{item.notifCount}</b>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-500/10 px-3.5 py-3">
                    <AdminIcon name="alert" size={16} />
                    <span className="text-[12.5px] leading-relaxed text-red-300">
                      Hesap silinince {item.productCount} takip, fiyat geçmişi ve
                      bildirim kayıtları çöp kutusuna taşınır; geri alınmazsa kalıcı
                      olarak silinebilir. Bu işlem müşteriye bildirilmez.
                    </span>
                  </div>

                  {error && (
                    <p className="mt-2 text-xs text-red-500">{error}</p>
                  )}

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => reject(item.id, item.name)}
                      disabled={pending}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-[13px] font-extrabold text-zinc-300 transition hover:border-zinc-600 disabled:opacity-50"
                    >
                      Talebi reddet
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(item.id, item.name)}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-red-400 disabled:opacity-50"
                    >
                      <AdminIcon name="trash" size={14} />
                      Hesabı kalıcı olarak sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
            {items.length === 0
              ? "Bekleyen hesap kaldırma talebi yok."
              : "Aramana uyan talep bulunamadı."}
          </div>
        )}
      </div>
    </div>
  );
}