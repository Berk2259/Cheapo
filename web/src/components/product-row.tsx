"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import type { Option, ProductData } from "@/components/product-drawer";
import {
  deleteProduct,
  requestImmediateCheck,
} from "@/app/admin/products/actions";

export function ProductRow({
  product,
  categories,
  sources,
  onEdit,
}: {
  product: ProductData;
  categories: Option[];
  sources: Option[];
  onEdit: (product: ProductData) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    const ok = confirm(
      `"${product.name}" ürününü silmek istediğine emin misin? Takipleri ve fiyat geçmişi de silinir.`,
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (!result.ok) {
        setMessage(result.message ?? "Silinemedi.");
      }
    });
  }

  function checkNow() {
    startTransition(async () => {
      const result = await requestImmediateCheck(product.id);
      if (!result.ok) {
        setMessage(result.message ?? "İstek gönderilemedi.");
      }
    });
  }

  const categoryName =
    categories.find((c) => c.id === product.category_id)?.name ?? "-";
  const sourceName =
    sources.find((s) => s.id === product.source_id)?.name ?? "-";

  const price =
    product.current_price !== null
      ? `${Number(product.current_price).toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${product.currency}`
      : "-";

  const lastChecked = product.last_checked_at
    ? new Date(product.last_checked_at).toLocaleString("tr-TR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Henüz kontrol edilmedi";

  const isOk = product.last_status?.startsWith("ok") ?? false;
  const hasError = !!product.last_status && !isOk;
  const method = isOk ? product.last_status?.split("·")[1]?.trim() : null;

  const status = !product.is_active
    ? { label: "Pasif", cls: "bg-zinc-700/40 text-zinc-400", dot: false }
    : hasError
      ? { label: "Okunamadı", cls: "bg-red-500/15 text-red-400", dot: false }
      : isOk
        ? { label: "Güncel", cls: "bg-emerald-500/15 text-emerald-400", dot: true }
        : { label: "Sırada", cls: "bg-amber-400/15 text-amber-300", dot: false };

  const iconButton =
    "grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-zinc-800 bg-zinc-900 text-zinc-500 transition hover:-translate-y-0.5 hover:border-emerald-500 hover:text-emerald-500 disabled:opacity-50";

  return (
    <tr
      className={
        "transition-colors hover:bg-emerald-500/5 " +
        (product.is_active ? "" : "opacity-60")
      }
    >
      <td className="px-4 py-3">
        <p className="font-bold text-zinc-50">{product.name}</p>
        <p className="text-xs text-zinc-500">
          {categoryName} · {sourceName}
          {product.comparison_group && (
            <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-px text-[11px] font-bold text-emerald-300">
              {product.comparison_group}
            </span>
          )}
        </p>
        {message && <p className="mt-1 text-xs text-red-500">{message}</p>}
      </td>
      <td className="px-4 py-3 font-extrabold tabular-nums text-zinc-50">
        {price}
      </td>
      <td className="px-4 py-3 text-zinc-300">
        {lastChecked}
        <p className="text-xs text-zinc-500">
          her {product.check_interval_minutes} dk
        </p>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${status.cls}`}
        >
          <i
            className={
              "h-1.5 w-1.5 rounded-full bg-current" +
              (status.dot ? " animate-pulse" : "")
            }
          />
          {status.label}
        </span>
        {hasError && (
          <p
            className="mt-1 max-w-xs truncate text-xs text-red-400"
            title={product.last_status ?? undefined}
          >
            {product.last_status}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        {method ? (
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-bold text-zinc-400">
            {method}
          </span>
        ) : (
          <span className="text-xs text-zinc-600">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {product.force_check_requested ? (
            <span className="inline-flex h-[34px] items-center gap-1.5 rounded-[10px] border border-amber-400/30 px-2.5 text-xs font-bold text-amber-300">
              <span className="animate-spin">
                <AdminIcon name="refresh" size={14} />
              </span>
              Bekleniyor
            </span>
          ) : (
            <button
              type="button"
              onClick={checkNow}
              disabled={pending}
              title="Şimdi kontrol et"
              aria-label="Şimdi kontrol et"
              className={iconButton}
            >
              <AdminIcon name="refresh" size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(product)}
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
            disabled={pending}
            title="Sil"
            aria-label="Sil"
            className={`${iconButton} hover:!border-red-500 hover:!text-red-400`}
          >
            <AdminIcon name="trash" size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}