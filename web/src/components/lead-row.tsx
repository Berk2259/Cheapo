"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import {
  convertLeadToCustomer,
  deleteLead,
  updateLeadStatus,
} from "@/app/admin/leads/actions";

export type Lead = {
  id: number;
  name: string;
  contact: string;
  plan_requested: string;
  category_interest: string | null;
  note: string | null;
  status: string;
  created_at: string;
  converted_customer_id: number | null;
  ago: string;
};

export const STATUS_OPTIONS = [
  { value: "bekliyor", label: "Bekliyor", cls: "bg-amber-400/15 text-amber-300" },
  { value: "inceleniyor", label: "İnceleniyor", cls: "bg-sky-400/15 text-sky-300" },
  { value: "tamamlandi", label: "Tamamlandı", cls: "bg-emerald-500/15 text-emerald-400" },
  { value: "reddedildi", label: "Reddedildi", cls: "bg-red-500/15 text-red-400" },
];

const fieldClass =
  "w-full rounded-[11px] border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(45,212,191,0.13)]";

const iconButton =
  "grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-zinc-800 bg-zinc-900 text-zinc-500 transition hover:-translate-y-0.5 disabled:opacity-50";

export function LeadRow({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState(lead.status);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [creatingAccount, setCreatingAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState(lead.plan_requested);

  function changeStatus(newStatus: string) {
    const previous = status;
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, newStatus);
      if (!result.ok) {
        setStatus(previous);
        setMessage(result.message ?? "Kaydedilemedi.");
      } else {
        setMessage(null);
      }
    });
  }

  function remove() {
    const ok = confirm(`"${lead.name}" talebini silmek istediğine emin misin?`);
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteLead(lead.id);
      if (!result.ok) {
        setMessage(result.message ?? "Silinemedi.");
      }
    });
  }

  function createAccount() {
    startTransition(async () => {
      const result = await convertLeadToCustomer(lead.id, {
        email,
        password,
        name: lead.name,
        plan,
      });
      if (result.ok) {
        setCreatingAccount(false);
        setMessage(null);
      } else {
        setMessage(result.message ?? "Hesap oluşturulamadı.");
      }
    });
  }

  const statusStyle =
    STATUS_OPTIONS.find((s) => s.value === status)?.cls ?? "";
  const premium = lead.plan_requested === "premium";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-[18px] transition-colors hover:border-emerald-500/40">
      <div className="flex flex-wrap items-start gap-3.5">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-emerald-500/15 text-base font-extrabold text-emerald-400">
          {(lead.name.trim()[0] ?? "?").toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[15px] text-zinc-50">{lead.name}</b>
            <span
              className={
                "rounded-full px-2.5 py-0.5 text-xs font-bold " +
                (premium
                  ? "bg-amber-400/15 text-amber-300"
                  : "bg-zinc-700/40 text-zinc-400")
              }
            >
              {premium ? "Premium" : "Ücretsiz"}
            </span>
            <small className="text-zinc-500">{lead.ago}</small>
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-300">
            <AdminIcon name="mail" size={14} />
            {lead.contact}
          </p>

          {lead.category_interest && (
            <p className="mt-0.5 text-xs text-zinc-500">
              Kategori:{" "}
              <span className="text-zinc-300">{lead.category_interest}</span>
            </p>
          )}

          {lead.note && (
            <p className="mt-2.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
              “{lead.note}”
            </p>
          )}

          {message && <p className="mt-2 text-xs text-red-500">{message}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={pending}
            aria-label="Durum"
            className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none disabled:opacity-60 ${statusStyle}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {lead.converted_customer_id ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400">
              <AdminIcon name="check" size={13} stroke={3} />
              Hesap açıldı
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingAccount(!creatingAccount)}
              className="rounded-[10px] bg-emerald-500 px-3.5 py-2 text-xs font-bold text-[#052e2b] transition hover:-translate-y-0.5"
            >
              Hesap aç
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            title="Sil"
            aria-label="Sil"
            className={`${iconButton} hover:border-red-500 hover:text-red-400`}
          >
            <AdminIcon name="trash" size={16} />
          </button>
        </div>
      </div>

      {creatingAccount && !lead.converted_customer_id && (
        <div className="ad-in mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="mb-3 text-sm font-bold text-zinc-50">
            {lead.name} için hesap oluştur
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              autoFocus
              className={fieldClass}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre (en az 8 karakter)"
              className={fieldClass}
            />
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className={fieldClass}
            >
              <option value="free">Ücretsiz plan</option>
              <option value="premium">Premium plan</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={createAccount}
              disabled={pending}
              className="rounded-[10px] bg-emerald-500 px-3.5 py-2 text-xs font-bold text-[#052e2b] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {pending ? "Oluşturuluyor..." : "Hesabı oluştur"}
            </button>
            <button
              type="button"
              onClick={() => setCreatingAccount(false)}
              disabled={pending}
              className="rounded-[10px] border border-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-50 transition hover:border-emerald-500 disabled:opacity-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}