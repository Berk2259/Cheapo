"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import {
  SubscriptionDrawer,
  type Option,
  type SubscriptionEdit,
} from "@/components/subscription-drawer";
import { deleteSubscription } from "@/app/admin/subscriptions/actions";

export type SubItem = {
  id: number;
  customerId: number;
  customerName: string;
  productName: string;
  sourceName: string;
  currentPrice: number | null;
  currency: string;
  targetPrice: number | null;
  notifyAny: boolean;
};

export type CustomerInfo = {
  id: number;
  name: string;
  bound: boolean;
  active: boolean;
};

const COLLAPSE_THRESHOLD = 5;

function money(value: number | null, currency: string) {
  if (value === null) return "-";
  return `${Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

// Güncel fiyatın hedefe göre durumu.
function targetStatus(item: SubItem) {
  if (item.targetPrice === null || item.currentPrice === null) return null;
  if (item.currentPrice <= item.targetPrice) {
    return { text: "Hedefin altında ✓", cls: "text-emerald-400" };
  }
  const gap =
    ((item.currentPrice - item.targetPrice) / item.targetPrice) * 100;
  return {
    text: `Hedefe %${gap.toFixed(1).replace(".", ",")} uzak`,
    cls: "text-amber-300",
  };
}

const iconButton =
  "grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-zinc-800 bg-zinc-900 text-zinc-500 transition hover:-translate-y-0.5 hover:border-emerald-500 hover:text-emerald-500 disabled:opacity-50";

function SubRow({
  item,
  onEdit,
}: {
  item: SubItem;
  onEdit: (item: SubItem) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    const ok = confirm(
      `"${item.customerName}" müşterisinin "${item.productName}" takibini silmek istediğine emin misin?`,
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteSubscription(item.id);
      if (!result.ok) {
        setError(result.message ?? "Silinemedi.");
      }
    });
  }

  const status = targetStatus(item);

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 py-3 first:border-t-0">
      <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px] bg-emerald-500/15 text-emerald-400">
        <AdminIcon name="package" size={16} />
      </span>

      <div className="min-w-0 flex-1 basis-56">
        <p className="truncate text-sm font-bold text-zinc-50">
          {item.productName}
          {item.sourceName && (
            <span className="ml-1.5 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-bold text-zinc-400">
              {item.sourceName}
            </span>
          )}
        </p>
        <p className="text-xs text-zinc-500">
          Güncel: {money(item.currentPrice, item.currency)}
          {status && (
            <span className={`ml-2 font-bold ${status.cls}`}>{status.text}</span>
          )}
        </p>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {item.targetPrice !== null && (
          <span className="rounded-full bg-sky-400/15 px-2.5 py-0.5 text-xs font-bold text-sky-300">
            Hedef {money(item.targetPrice, item.currency)}
          </span>
        )}
        {item.notifyAny && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
            Her değişimde
          </span>
        )}
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(item)}
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
    </div>
  );
}

export function SubscriptionsList({
  items,
  customers,
  productOptions,
}: {
  items: SubItem[];
  customers: CustomerInfo[];
  productOptions: Option[];
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<SubscriptionEdit | null>(null);
  const [adding, setAdding] = useState(false);
  const [openIds, setOpenIds] = useState<Set<number>>(() => {
    const counts = new Map<number, number>();
    for (const it of items) {
      counts.set(it.customerId, (counts.get(it.customerId) ?? 0) + 1);
    }
    const set = new Set<number>();
    for (const c of customers) {
      if ((counts.get(c.id) ?? 0) <= COLLAPSE_THRESHOLD) set.add(c.id);
    }
    return set;
  });

  const canAdd = customers.length > 0 && productOptions.length > 0;

  const q = query.trim().toLocaleLowerCase("tr");
  const visible = items.filter(
    (i) =>
      !q ||
      `${i.customerName} ${i.productName}`.toLocaleLowerCase("tr").includes(q),
  );

  const groups = customers
    .map((customer) => ({
      customer,
      items: visible.filter((i) => i.customerId === customer.id),
    }))
    .filter((g) => g.items.length > 0);

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function closeDrawer() {
    setEditing(null);
    setAdding(false);
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <label className="flex min-w-[260px] items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-500 transition focus-within:border-emerald-500 focus-within:shadow-[0_0_0_4px_rgba(45,212,191,0.13)]">
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Müşteri ya da ürün ara…"
            className="w-full bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
          />
        </label>

        <span className="text-sm text-zinc-500">{visible.length} takip</span>

        {canAdd ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-[11px] bg-emerald-500 px-3.5 py-2 text-sm font-bold text-[#052e2b] transition hover:-translate-y-0.5"
          >
            <AdminIcon name="plus" size={16} /> Takip ekle
          </button>
        ) : (
          <p className="ml-auto text-sm text-zinc-500">
            Takip eklemek için önce en az bir müşteri ve bir ürün ekle.
          </p>
        )}
      </div>

      <div className="grid gap-3.5">
        {groups.map(({ customer, items: rows }, i) => {
          const isOpen = q ? true : openIds.has(customer.id);
          return (
            <section
              key={customer.id}
              className="ad-in rounded-2xl border border-zinc-800 bg-zinc-900 p-[18px]"
              style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => toggle(customer.id)}
                className="-m-[18px] flex w-[calc(100%+36px)] flex-wrap items-center gap-3 rounded-2xl p-[18px] text-left transition hover:bg-white/[0.03]"
              >
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-emerald-500/15 text-base font-extrabold text-emerald-400">
                  {(customer.name.trim()[0] ?? "?").toUpperCase()}
                </span>
                <div>
                  <b className="text-[15px] text-zinc-50">{customer.name}</b>
                  <p className="text-xs text-zinc-500">{rows.length} takip</p>
                </div>

                {!customer.active ? (
                  <span className="ml-auto rounded-full bg-zinc-700/40 px-2.5 py-0.5 text-xs font-bold text-zinc-400">
                    Pasif müşteri, bildirim gitmez
                  </span>
                ) : customer.bound ? (
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                    <AdminIcon name="send" size={12} />
                    Telegram bağlı
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-400">
                    <AdminIcon name="alert" size={12} />
                    Telegram bağlı değil, bildirim gitmez
                  </span>
                )}

                <span
                  className={
                    "grid h-8 w-8 flex-none place-items-center rounded-lg bg-zinc-800/60 text-zinc-400 transition-transform " +
                    (isOpen ? "rotate-90" : "")
                  }
                >
                  <AdminIcon name="arrow" size={15} />
                </span>
              </button>

              {isOpen && (
                <div className="mt-1">
                  {rows.map((item) => (
                    <SubRow
                      key={item.id}
                      item={item}
                      onEdit={(it) =>
                        setEditing({
                          id: it.id,
                          customerName: it.customerName,
                          productName: it.productName,
                          targetPrice: it.targetPrice,
                          notifyAny: it.notifyAny,
                        })
                      }
                    />
                  ))}
                </div>
              )}

            </section>
          );
        })}

        {groups.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
            {items.length === 0
              ? "Henüz takip yok."
              : "Aramana uyan takip bulunamadı."}
          </div>
        )}
      </div>

      {(editing || adding) && (
        <SubscriptionDrawer
          key={editing?.id ?? "new"}
          editing={editing}
          customers={customers.map((c) => ({ id: c.id, name: c.name }))}
          products={productOptions}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}