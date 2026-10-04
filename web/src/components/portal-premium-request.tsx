"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import { requestPremiumUpgrade } from "@/app/portal/actions";

export function PortalPremiumRequest({
  alreadyRequested,
}: {
  alreadyRequested: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(alreadyRequested);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-[13px] font-extrabold text-amber-300">
        <AdminIcon name="clock" size={15} /> Premium talebin inceleniyor
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-4 py-2.5 font-extrabold text-[#3b2a00] shadow-[0_10px_24px_-10px_#f59e0b]"
      >
        <AdminIcon name="crown" size={16} /> Premium&apos;a geç
      </button>
    );
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await requestPremiumUpgrade({ phone, note });
      if (result.ok) {
        setSent(true);
      } else {
        setMessage(result.message ?? "Gönderilemedi.");
      }
    });
  }

  return (
    <div className="mt-1 grid gap-2.5 rounded-xl border border-amber-400/20 bg-black/20 p-3.5">
      <div>
        <label className="mb-1 block text-xs font-bold text-amber-100">
          Telefon (opsiyonel)
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05xx xxx xx xx"
          className="w-full rounded-lg border border-amber-400/25 bg-black/30 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-amber-100">
          Not (opsiyonel)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Örn: kaç ürün takip etmek istiyorum vb."
          className="w-full resize-none rounded-lg border border-amber-400/25 bg-black/30 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-amber-400"
        />
      </div>
      {message && <p className="text-xs text-red-400">{message}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="rounded-lg bg-amber-400 px-4 py-2 text-[13px] font-extrabold text-[#3b2a00] disabled:opacity-60"
      >
        {pending ? "Gönderiliyor…" : "Talebi gönder"}
      </button>
    </div>
  );
}