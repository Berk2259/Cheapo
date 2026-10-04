"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import { deleteSignup, setSignupActive } from "@/app/admin/signups/actions";

export type SignupItem = {
  id: number;
  name: string;
  email: string;
  plan: string;
  active: boolean;
  bound: boolean;
  joined: string;
};

function Row({ item }: { item: SignupItem }) {
  const [active, setActive] = useState(item.active);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    const next = !active;
    setActive(next);
    setError(null);
    startTransition(async () => {
      const result = await setSignupActive(item.id, next);
      if (!result.ok) {
        setActive(!next);
        setError(result.message ?? "Güncellenemedi.");
      }
    });
  }

  function remove() {
    const ok = confirm(`"${item.name}" müşterisini silmek istediğine emin misin?`);
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSignup(item.id);
      if (!result.ok) setError(result.message ?? "Silinemedi.");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 px-[18px] py-4">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-zinc-800 text-base font-extrabold text-zinc-400">
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
          {!active && (
            <span className="rounded-full bg-zinc-700/40 px-2.5 py-0.5 text-xs font-extrabold text-zinc-400">
              Pasif
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-zinc-500">
          {item.email} · {item.joined} katıldı ·{" "}
          {item.bound ? "Telegram bağlı" : "Telegram bağlı değil"}
        </p>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
      <div className="flex flex-none items-center gap-2">
        <button
          type="button"
          onClick={toggleActive}
          disabled={pending}
          className={
            "rounded-xl border px-3.5 py-2 text-[13px] font-extrabold transition disabled:opacity-50 " +
            (active
              ? "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600"
              : "border-emerald-500 bg-emerald-500/10 text-emerald-400")
          }
        >
          {active ? "Pasif yap" : "Aktif yap"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-900/50 bg-zinc-950 px-3.5 py-2 text-[13px] font-extrabold text-red-400 transition hover:border-red-500 disabled:opacity-50"
        >
          <AdminIcon name="trash" size={14} /> Sil
        </button>
      </div>
    </div>
  );
}

export function SignupsList({ items }: { items: SignupItem[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLocaleLowerCase("tr");
  const visible = items.filter(
    (i) =>
      !q ||
      `${i.name} ${i.email}`.toLocaleLowerCase("tr").includes(q),
  );

  return (
    <div className="mt-6">
      <label className="flex min-w-[260px] max-w-sm items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-500 transition focus-within:border-emerald-500 focus-within:shadow-[0_0_0_4px_rgba(45,212,191,0.13)]">
        <AdminIcon name="search" size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ad ya da e-posta ara…"
          className="w-full bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
        />
      </label>

      <div className="mt-4 grid gap-3">
        {visible.map((item) => (
          <Row key={item.id} item={item} />
        ))}

        {visible.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
            {items.length === 0
              ? "Henüz kendi kendine kayıt olan müşteri yok."
              : "Aramana uyan müşteri bulunamadı."}
          </div>
        )}
      </div>
    </div>
  );
}