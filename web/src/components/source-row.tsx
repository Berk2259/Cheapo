"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import { deleteSource, updateSource } from "@/app/admin/sources/actions";
import { SOURCE_METHODS, methodLabel } from "@/lib/source-methods";

const SUB_METHODS: Record<
  string,
  { label: string; icon: Parameters<typeof AdminIcon>[0]["name"]; cls: string }
> = {
  json_ld: { label: "JSON-LD", icon: "tag", cls: "bg-emerald-500/12 text-emerald-400" },
  next_data: { label: "Sayfa verisi", icon: "grid", cls: "bg-blue-400/12 text-blue-300" },
  data_testid: { label: "HTML etiketi", icon: "target", cls: "bg-purple-400/12 text-purple-300" },
  price_class: { label: "CSS sınıfı", icon: "spark", cls: "bg-amber-400/12 text-amber-300" },
};


export type SourceItem = {
  id: number;
  name: string;
  method: string;
  base_url: string | null;
  is_active: boolean;
  productCount: number;
  methods: string[];
};

const fieldClass =
  "w-full rounded-[11px] border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(45,212,191,0.13)]";

const iconButton =
  "grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-zinc-800 bg-zinc-900 text-zinc-500 transition hover:-translate-y-0.5 hover:border-emerald-500 hover:text-emerald-500 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-zinc-800 disabled:hover:text-zinc-500";

export function SourceRow({ source }: { source: SourceItem }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(source.name);
  const [method, setMethod] = useState(source.method);
  const [baseUrl, setBaseUrl] = useState(source.base_url ?? "");
  const [isActive, setIsActive] = useState(source.is_active);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startEdit() {
    setName(source.name);
    setMethod(source.method);
    setBaseUrl(source.base_url ?? "");
    setIsActive(source.is_active);
    setMessage(null);
    setEditing(true);
  }

  function cancel() {
    setMessage(null);
    setEditing(false);
  }

  function save() {
    startTransition(async () => {
      const result = await updateSource(source.id, {
        name,
        method,
        baseUrl,
        isActive,
      });
      if (result.ok) {
        setMessage(null);
        setEditing(false);
      } else {
        setMessage(result.message ?? "Kaydedilemedi.");
      }
    });
  }

  function remove() {
    const ok = confirm(
      `"${source.name}" kaynağını silmek istediğine emin misin?`,
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteSource(source.id);
      if (!result.ok) {
        setMessage(result.message ?? "Silinemedi.");
      }
    });
  }

  const hasProducts = source.productCount > 0;

  if (editing) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900 p-[18px]">
        <div className="grid gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-500">
              Kaynak adı
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-500">
              Yöntem
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={fieldClass}
            >
              {SOURCE_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-500">
              Adres (isteğe bağlı)
            </label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://..."
              className={fieldClass}
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2.5 text-left text-sm font-semibold text-zinc-50"
          >
            <span
              className={
                "relative h-6 w-[42px] rounded-full transition-colors " +
                (isActive ? "bg-emerald-500" : "bg-zinc-700")
              }
            >
              <span
                className={
                  "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all " +
                  (isActive ? "left-[21px]" : "left-[3px]")
                }
              />
            </span>
            Kaynak aktif
          </button>
        </div>

        {message && <p className="mt-3 text-xs text-red-500">{message}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-[10px] bg-emerald-500 px-3.5 py-2 text-xs font-bold text-[#052e2b] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="rounded-[10px] border border-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-50 transition hover:border-emerald-500 disabled:opacity-50"
          >
            İptal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        "rounded-2xl border border-zinc-800 bg-zinc-900 p-[18px] transition-colors hover:border-emerald-500/40 " +
        (source.is_active ? "" : "opacity-60")
      }
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <AdminIcon name="globe" size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <b className="block truncate text-[15px] text-zinc-50">
            {source.name}
          </b>
          <small className="text-zinc-500">{methodLabel(source.method)}</small>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={startEdit}
            disabled={pending}
            title="Düzenle"
            aria-label="Düzenle"
            className={iconButton}
          >
            <AdminIcon name="edit" size={16} />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending || hasProducts}
            title={
              hasProducts
                ? "Bağlı ürünler var, önce onları taşı ya da sil"
                : "Sil"
            }
            aria-label="Sil"
            className={iconButton}
          >
            <AdminIcon name="trash" size={16} />
          </button>
        </div>
      </div>

      {source.base_url && (
        <a
          href={source.base_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block truncate text-xs text-zinc-500 hover:text-emerald-500"
        >
          {source.base_url}
        </a>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold " +
            (source.is_active
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-zinc-700/40 text-zinc-400")
          }
        >
          <i className="h-1.5 w-1.5 rounded-full bg-current" />
          {source.is_active ? "Aktif" : "Pasif"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300">
          <AdminIcon name="package" size={13} />
          {source.productCount} ürün
        </span>
        {source.methods.map((m) => {
          const info = SUB_METHODS[m] ?? { label: m, icon: "tag" as const, cls: "bg-white/5 text-zinc-400" };
          return (
            <span
              key={m}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${info.cls}`}
              title="Fiyat bu yöntemle okunuyor"
            >
              <AdminIcon name={info.icon} size={12} stroke={2.6} />
              {info.label}
            </span>
          );
        })}
      </div>

      {message && <p className="mt-3 text-xs text-red-500">{message}</p>}
    </div>
  );
}