"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import {
  deleteCustomerRequest,
  updateCustomerRequestStatus,
} from "@/app/admin/customer-requests/actions";

const STATUS_OPTIONS = [
  { value: "bekliyor", label: "Bekliyor", cls: "bg-amber-400/15 text-amber-300" },
  { value: "inceleniyor", label: "İnceleniyor", cls: "bg-sky-400/15 text-sky-300" },
  { value: "tamamlandi", label: "Tamamlandı", cls: "bg-emerald-500/15 text-emerald-400" },
  { value: "reddedildi", label: "Reddedildi", cls: "bg-red-400/15 text-red-400" },
];

export type CustomerRequest = {
  id: number;
  note: string | null;
  status: string;
  created_at: string;
  customerName: string;
  categoryName: string;
  productNames: string[];
  ago: string;
};

export function CustomerRequestRow({ request }: { request: CustomerRequest }) {
  const [status, setStatus] = useState(request.status);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeStatus(newStatus: string) {
    const previous = status;
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateCustomerRequestStatus(request.id, newStatus);
      if (!result.ok) {
        setStatus(previous);
        setMessage(result.message ?? "Kaydedilemedi.");
      } else {
        setMessage(null);
      }
    });
  }

  function remove() {
    const ok = confirm(
      `"${request.customerName}" müşterisinin bu talebini silmek istediğine emin misin?`,
    );
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteCustomerRequest(request.id);
      if (!result.ok) setMessage(result.message ?? "Silinemedi.");
    });
  }

  const statusStyle =
    STATUS_OPTIONS.find((s) => s.value === status)?.cls ?? "";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-[18px] transition-colors hover:border-emerald-500/40">
      <div className="flex flex-wrap items-start gap-3.5">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-emerald-500/15 text-base font-extrabold text-emerald-400">
          {(request.customerName.trim()[0] ?? "?").toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[15px] text-zinc-50">{request.customerName}</b>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              {request.categoryName}
            </span>
            <small className="text-zinc-500">{request.ago}</small>
          </div>

          {request.productNames.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {request.productNames.map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300"
                >
                  <AdminIcon name="package" size={13} />
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">Ürün seçilmemiş.</p>
          )}

          {request.note && (
            <p className="mt-2.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
              “{request.note}”
            </p>
          )}

          {status === "tamamlandi" && request.productNames.length > 0 && (
            <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <AdminIcon name="check" size={13} stroke={3} />
              Seçilen ürünler müşterinin takibine eklendi.
            </p>
          )}

          {message && <p className="mt-2 text-xs text-red-500">{message}</p>}
        </div>

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

        <button
          type="button"
          onClick={remove}
          disabled={pending}
          title="Sil"
          aria-label="Sil"
          className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px] border border-zinc-800 bg-zinc-900 text-zinc-500 transition hover:-translate-y-0.5 hover:border-red-500 hover:text-red-400 disabled:opacity-50"
        >
          <AdminIcon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}