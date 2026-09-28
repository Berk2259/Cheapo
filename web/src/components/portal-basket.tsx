"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminIcon } from "@/components/admin-icons";
import {
  addBasketItem,
  createList,
  createMatch,
  deleteList,
  removeBasketItem,
  removeMatch,
  renameList,
} from "@/app/portal/basket/actions";

export type BasketList = {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string;
  itemCount: number;
};
export type BasketRow = { source: string; price: number | null; currency: string; name: string };
export type BasketGroup = {
  key: string;
  name: string;
  manual: boolean;
  matchId: number | null;
  rows: BasketRow[];
};
export type BasketCandidate = {
  id: number;
  name: string;
  source: string;
  price: number | null;
  currency: string;
  rows: { source: string; price: number | null; currency: string }[];
};
type CategoryOption = { id: number; name: string };

function money(value: number, currency: string) {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function PortalBasket({
  lists,
  activeListId,
  groups,
  candidates,
  categories,
}: {
  lists: BasketList[];
  activeListId: number | null;
  groups: BasketGroup[];
  candidates: BasketCandidate[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchName, setMatchName] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [listModal, setListModal] = useState<"new" | number | null>(null);
  const [listNameInput, setListNameInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<number | null>(
    categories[0]?.id ?? null,
  );
  const [deleteTarget, setDeleteTarget] = useState<BasketList | null>(null);
  const [, startTransition] = useTransition();

  const activeList = lists.find((l) => l.id === activeListId) ?? null;

  const stores = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => g.rows.forEach((r) => r.source && set.add(r.source)));
    return [...set].sort();
  }, [groups]);

  const currency =
    groups.flatMap((g) => g.rows).find((r) => r.price !== null)?.currency ?? "TRY";

  function priceFor(g: BasketGroup, store: string): number | null {
    const row = g.rows.find((r) => r.source === store);
    return row && row.price !== null ? row.price : null;
  }

  const storeStats = stores.map((store) => {
    let total = 0;
    let count = 0;
    groups.forEach((g) => {
      const p = priceFor(g, store);
      if (p !== null) {
        total += p;
        count += 1;
      }
    });
    return { store, total, count, full: count > 0 && count === groups.length };
  });

  const fullStats = [...storeStats].filter((s) => s.full).sort((a, b) => a.total - b.total);
  const winner = fullStats[0] ?? null;
  const runnerUp = fullStats[1] ?? null;
  const savings = winner && runnerUp ? runnerUp.total - winner.total : 0;

  const filteredCandidates = candidates.filter((c) =>
    c.name.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")),
  );

  function goToList(id: number | null) {
    router.push(id ? `/portal/basket?list=${id}` : "/portal/basket");
  }

  function handleAdd(id: number) {
    if (!activeList) return;
    setMessage(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await addBasketItem(activeList.id, id);
      if (!result.ok) setMessage(result.message ?? "Eklenemedi.");
      setPendingId(null);
    });
  }

  function handleRemove(id: number) {
    if (!activeList) return;
    setMessage(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await removeBasketItem(activeList.id, id);
      if (!result.ok) setMessage(result.message ?? "Kaldırılamadı.");
      setPendingId(null);
    });
  }

  function handleUnlink(matchId: number) {
    setMessage(null);
    startTransition(async () => {
      const result = await removeMatch(matchId);
      if (!result.ok) setMessage(result.message ?? "Eşleştirme kaldırılamadı.");
    });
  }

  function toggleSelecting() {
    setSelecting((v) => !v);
    setSelected(new Set());
  }

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function confirmMatch() {
    if (!activeList) return;
    const trimmed = matchName.trim();
    if (!trimmed) {
      setMessage("Grup için bir isim yaz.");
      return;
    }
    const ids = [...selected].map(Number);
    setMessage(null);
    startTransition(async () => {
      const result = await createMatch(activeList.id, ids, trimmed);
      if (!result.ok) {
        setMessage(result.message ?? "Eşleştirilemedi.");
        return;
      }
      setMatchModalOpen(false);
      setMatchName("");
      setSelecting(false);
      setSelected(new Set());
    });
  }

  function openNewListModal() {
    setListModal("new");
    setListNameInput("");
    setCategoryInput(categories[0]?.id ?? null);
  }

  function openRenameModal(list: BasketList) {
    setListModal(list.id);
    setListNameInput(list.name);
    setOpenMenuId(null);
  }

  function confirmListModal() {
    const trimmed = listNameInput.trim();
    if (!trimmed) {
      setMessage("Bir isim yaz.");
      return;
    }
    setMessage(null);
    if (listModal === "new") {
      if (!categoryInput) {
        setMessage("Bir sektör seç.");
        return;
      }
      startTransition(async () => {
        const result = await createList(trimmed, categoryInput);
        if (!result.ok) {
          setMessage(result.message ?? "Sepet oluşturulamadı.");
          return;
        }
        setListModal(null);
        if (result.id) goToList(result.id);
      });
    } else if (typeof listModal === "number") {
      const id = listModal;
      startTransition(async () => {
        const result = await renameList(id, trimmed);
        if (!result.ok) {
          setMessage(result.message ?? "Yeniden adlandırılamadı.");
          return;
        }
        setListModal(null);
      });
    }
  }

  function confirmDeleteList() {
    if (!deleteTarget) return;
    const wasActive = deleteTarget.id === activeListId;
    startTransition(async () => {
      const result = await deleteList(deleteTarget.id);
      setDeleteTarget(null);
      if (!result.ok) {
        setMessage(result.message ?? "Sepet silinemedi.");
        return;
      }
      if (wasActive) goToList(null);
    });
  }

  const selectedGroups = groups.filter((g) => selected.has(g.key));

  return (
    <div>
      <div className="ad-in flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">Alışveriş listesi</h1>
          <p className="mt-0.5 text-zinc-500">
            Farklı sektörler için ayrı sepetler oluştur, her biri kendi ürünleriyle kalsın.
          </p>
        </div>
        {activeList && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleSelecting}
              className={
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-extrabold transition " +
                (selecting
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-emerald-500 hover:text-emerald-300")
              }
            >
              <AdminIcon name="scale" size={16} stroke={2.4} />
              Eşdeğer olarak eşleştir
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-[#052e2b] transition hover:bg-emerald-400"
            >
              <AdminIcon name="plus" size={16} stroke={2.6} />
              Ürün ekle
            </button>
          </div>
        )}
      </div>

      {/* Sepet seçici şerit */}
      <div className="ad-in relative z-20 mt-4 flex flex-wrap items-center gap-2">
        {lists.map((l) => (
          <div key={l.id} className="relative">
            <button
              type="button"
              onClick={() => goToList(l.id)}
              className={
                "flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition " +
                (l.id === activeListId
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700")
              }
            >
              <span>
                <b className="block text-[13px] font-extrabold">{l.name}</b>
                <span className="text-[11px] font-semibold text-zinc-500">
                  {l.categoryName || "Sektör yok"} · {l.itemCount} ürün
                </span>
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === l.id ? null : l.id);
                }}
                className="grid h-[22px] w-[22px] place-items-center rounded-lg text-zinc-500 hover:bg-white/10 hover:text-zinc-50"
              >
                ⋮
              </span>
            </button>
            {openMenuId === l.id && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[170px] rounded-xl border border-zinc-800 bg-[#111c1a] p-1.5 shadow-[0_18px_38px_-12px_rgba(0,0,0,0.6)]">
                <button
                  type="button"
                  onClick={() => openRenameModal(l)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-bold text-zinc-300 hover:bg-white/[0.06]"
                >
                  <AdminIcon name="edit" size={13} /> Yeniden adlandır
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(l);
                    setOpenMenuId(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-bold text-red-400 hover:bg-red-400/10"
                >
                  <AdminIcon name="trash" size={13} /> Sepeti sil
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={openNewListModal}
          className="flex items-center gap-1.5 rounded-2xl border border-dashed border-zinc-700 px-4 py-2.5 text-[13px] font-extrabold text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-300"
        >
          <AdminIcon name="plus" size={15} stroke={2.6} /> Yeni sepet
        </button>
      </div>

      {message && (
        <p className="ad-in mt-3 rounded-xl bg-red-400/15 px-4 py-2.5 text-sm font-bold text-red-400">
          {message}
        </p>
      )}

      {!activeList ? (
        <div className="mt-5 rounded-[20px] border-2 border-dashed border-zinc-800 px-5 py-12 text-center text-zinc-500">
          <b className="mb-1 block text-zinc-50">Henüz sepet yok</b>
          &quot;Yeni sepet&quot; ile bir sektör seçip ilk sepetini oluşturabilirsin.
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-5 rounded-[20px] border-2 border-dashed border-zinc-800 px-5 py-12 text-center text-zinc-500">
          <b className="mb-1 block text-zinc-50">Bu sepette henüz ürün yok</b>
          Sağ üstteki &quot;Ürün ekle&quot; ile {activeList.categoryName} kategorisindeki
          takip ettiğin ürünlerden seçebilirsin.
        </div>
      ) : (
        <>
          <div className="ad-in mt-4 overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-800 px-[18px] py-4">
              <b className="text-base">{activeList.name}</b>
              <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[11.5px] font-extrabold text-emerald-300">
                {activeList.categoryName}
              </span>
              <span className="text-[12.5px] font-bold text-zinc-500">
                {groups.length} ürün
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    {selecting && <th className="w-10 px-[18px] py-3"></th>}
                    <th className={selecting ? "px-3 py-3 font-bold" : "px-[18px] py-3 font-bold"}>
                      Ürün
                    </th>
                    {stores.map((store) => (
                      <th key={store} className="px-3 py-3 font-bold">
                        {store}
                      </th>
                    ))}
                    <th className="w-12 px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    const priced = g.rows
                      .map((r) => r.price)
                      .filter((p): p is number => p !== null);
                    const cheapest = priced.length ? Math.min(...priced) : null;
                    const id = Number(g.key.replace("match-", ""));
                    const checked = selected.has(g.key);
                    return (
                      <tr
                        key={g.key}
                        className={
                          "border-t border-zinc-800 " +
                          (g.manual ? "bg-emerald-500/[0.04]" : "")
                        }
                      >
                        {selecting && (
                          <td className="px-[18px] py-3">
                            {!g.manual && (
                              <button
                                type="button"
                                onClick={() => toggleSelect(g.key)}
                                className={
                                  "grid h-[19px] w-[19px] place-items-center rounded-[6px] border-[1.5px] transition " +
                                  (checked
                                    ? "border-emerald-500 bg-emerald-500 text-[#052e2b]"
                                    : "border-zinc-600")
                                }
                              >
                                {checked && (
                                  <AdminIcon name="check" size={11} stroke={3.2} />
                                )}
                              </button>
                            )}
                          </td>
                        )}
                        <td className={selecting ? "px-3 py-3" : "px-[18px] py-3"}>
                          <b className="font-extrabold">{g.name}</b>
                          {g.manual && (
                            <>
                              <span className="ml-1.5 inline-flex items-center gap-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300">
                                Sen eşleştirdin
                              </span>
                              <span className="mt-0.5 block text-[11px] font-semibold text-zinc-500">
                                {g.rows.map((r) => `${r.source}: ${r.name}`).join(" · ")}
                              </span>
                            </>
                          )}
                        </td>
                        {stores.map((store) => {
                          const p = priceFor(g, store);
                          const isCheapest = p !== null && p === cheapest;
                          return (
                            <td
                              key={store}
                              className={
                                "px-3 py-3 tabular-nums font-bold " +
                                (isCheapest
                                  ? "text-emerald-300"
                                  : p === null
                                    ? "text-zinc-600"
                                    : "")
                              }
                            >
                              {p !== null ? money(p, currency) : "—"}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3">
                          {g.manual ? (
                            <button
                              type="button"
                              onClick={() => handleUnlink(g.matchId as number)}
                              aria-label="Eşleştirmeyi kaldır"
                              title="Eşleştirmeyi kaldır"
                              className="grid h-[26px] w-[26px] place-items-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-amber-400 hover:text-amber-300"
                            >
                              <AdminIcon name="refresh" size={13} stroke={2.4} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemove(id)}
                              disabled={pendingId === id}
                              aria-label={`${g.name} kaldır`}
                              className="grid h-[26px] w-[26px] place-items-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-red-400 hover:text-red-400 disabled:opacity-40"
                            >
                              <AdminIcon name="x" size={13} stroke={2.6} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-800">
                    {selecting && <td></td>}
                    <td className={selecting ? "px-3 py-4 font-extrabold" : "px-[18px] py-4 font-extrabold"}>
                      Toplam ({groups.length} ürün)
                    </td>
                    {storeStats.map((s) => (
                      <td
                        key={s.store}
                        className={
                          "px-3 py-4 text-[15px] font-extrabold tabular-nums " +
                          (winner && s.store === winner.store ? "text-emerald-300" : "")
                        }
                      >
                        {s.count > 0 ? money(s.total, currency) : "—"}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {selecting && selected.size >= 2 && (
            <div className="ad-in mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500 bg-[#0e1f1c] px-[18px] py-3.5 shadow-[0_18px_38px_-20px_rgba(16,185,129,0.5)]">
              <b className="text-[13.5px]">{selected.size} ürün seçildi</b>
              <span className="text-xs text-zinc-500">
                Farklı markette olan bu ürünleri &quot;eşdeğer&quot; olarak birleştir
              </span>
              <button
                type="button"
                onClick={toggleSelecting}
                className="ml-auto rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-400"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => setMatchModalOpen(true)}
                className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-extrabold text-[#052e2b]"
              >
                Eşleştir →
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {storeStats.map((s) => {
              const isWinner = winner !== null && s.store === winner.store;
              const missing = groups.length - s.count;
              return (
                <div
                  key={s.store}
                  className={
                    "relative rounded-[20px] border bg-zinc-900 p-[18px] " +
                    (isWinner
                      ? "border-emerald-500 shadow-[0_18px_38px_-20px_rgba(16,185,129,0.55)]"
                      : "border-zinc-800")
                  }
                >
                  {isWinner && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#052e2b]">
                      🏆 En ucuz
                    </span>
                  )}
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-emerald-500/15 font-extrabold text-emerald-300">
                      {s.store[0]}
                    </span>
                    <div>
                      <b className="block text-[14.5px]">{s.store}</b>
                      <span className="text-xs text-zinc-500">
                        {s.count}/{groups.length} ürün mevcut
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-[22px] font-extrabold tracking-[-0.02em]">
                    {s.count > 0 ? money(s.total, currency) : "—"}
                  </div>
                  {isWinner && runnerUp && savings > 0.001 && (
                    <div className="mt-1 text-xs font-extrabold text-emerald-400">
                      {runnerUp.store}&apos;a göre {money(savings, currency)} ucuz
                    </div>
                  )}
                  {!s.full && missing > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11.5px] font-bold text-amber-300">
                      <AdminIcon name="alert" size={13} />
                      {missing} ürün bu markette yok
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[12.5px] text-zinc-500">
            Sadece bu sepete eklediğin ürünler burada görünür. Farklı marka ama aynı
            ihtiyacı karşılayan ürünleri &quot;Eşdeğer olarak eşleştir&quot; ile elle
            birleştirebilirsin.
          </p>
        </>
      )}

      {/* Yeni sepet / yeniden adlandır modalı */}
      {listModal !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4">
          <div className="w-full max-w-[420px] rounded-[20px] border border-zinc-800 bg-[#0c1817] p-[22px]">
            <h3 className="text-base font-extrabold">
              {listModal === "new" ? "Yeni sepet oluştur" : "Sepeti yeniden adlandır"}
            </h3>
            <p className="mb-1 mt-1 text-[12.5px] text-zinc-500">
              {listModal === "new"
                ? "Sektör seçince \"Ürün ekle\" paneli sadece o sektördeki ürünleri gösterir."
                : "Sadece ismini değiştir, sektör ve ürünler aynı kalır."}
            </p>
            <label className="mb-1.5 mt-3.5 block text-xs font-bold text-zinc-400">
              Sepet adı
            </label>
            <input
              type="text"
              value={listNameInput}
              onChange={(e) => setListNameInput(e.target.value)}
              placeholder="örn. Yılbaşı Alışverişi"
              className="w-full rounded-[10px] border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-emerald-500"
            />
            {listModal === "new" && (
              <>
                <label className="mb-1.5 mt-3.5 block text-xs font-bold text-zinc-400">
                  Sektör
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryInput(c.id)}
                      className={
                        "rounded-xl border px-2 py-2.5 text-[11.5px] font-bold transition " +
                        (categoryInput === c.id
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-800 text-zinc-400")
                      }
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setListModal(null)}
                className="rounded-[10px] border border-zinc-800 px-3.5 py-2 text-[13px] font-bold text-zinc-400"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmListModal}
                className="rounded-[10px] bg-emerald-500 px-4 py-2 text-[13px] font-extrabold text-[#052e2b]"
              >
                {listModal === "new" ? "Sepeti oluştur" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sepet silme onayı */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4">
          <div className="w-full max-w-[420px] rounded-[20px] border border-zinc-800 bg-[#0c1817] p-[22px]">
            <h3 className="text-base font-extrabold">Sepeti sil</h3>
            <p className="mb-5 mt-2 text-[13px] text-zinc-400">
              &quot;{deleteTarget.name}&quot; sepetini ve içindeki {deleteTarget.itemCount}{" "}
              ürünü silmek istediğine emin misin? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-[10px] border border-zinc-800 px-3.5 py-2 text-[13px] font-bold text-zinc-400"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmDeleteList}
                className="rounded-[10px] bg-red-500 px-4 py-2 text-[13px] font-extrabold text-white"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eşdeğer eşleştirme modalı */}
      {matchModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4">
          <div className="w-full max-w-[400px] rounded-[20px] border border-zinc-800 bg-[#0c1817] p-[22px]">
            <h3 className="text-base font-extrabold">Eşdeğer olarak eşleştir</h3>
            <p className="mb-4 mt-1 text-[12.5px] text-zinc-500">
              Bu ürünler farklı markette/markada ama aynı ihtiyacı karşılıyorsa birleştirip
              tek satırda kıyaslayabilirsin.
            </p>
            <div className="mb-4 flex flex-col gap-2">
              {selectedGroups.map((g) => (
                <div
                  key={g.key}
                  className="rounded-xl border border-zinc-800 px-3 py-2.5 text-[13px] font-bold"
                >
                  {g.name}
                </div>
              ))}
            </div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-400">
              Bu grup için bir isim ver
            </label>
            <input
              type="text"
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              placeholder="örn. Tavuk eti"
              className="mb-4 w-full rounded-[10px] border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMatchModalOpen(false);
                  setMatchName("");
                }}
                className="rounded-[10px] border border-zinc-800 px-3.5 py-2 text-[13px] font-bold text-zinc-400"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmMatch}
                className="rounded-[10px] bg-emerald-500 px-4 py-2 text-[13px] font-extrabold text-[#052e2b]"
              >
                Eşleştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ürün ekle paneli */}
      {drawerOpen && activeList && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-41 flex w-full max-w-[420px] flex-col border-l border-zinc-800 bg-[#0c1817]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h3 className="text-base font-extrabold">Ürün ekle</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-[30px] w-[30px] place-items-center rounded-[9px] border border-zinc-800 text-zinc-400"
              >
                <AdminIcon name="x" size={14} />
              </button>
            </div>
            <div className="border-b border-zinc-800 px-5 py-3.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${activeList.categoryName} kategorisindeki ürünlerinde ara...`}
                className="w-full rounded-[10px] border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {filteredCandidates.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-zinc-500">
                  Eklenebilecek ürün bulunamadı.
                </p>
              ) : (
                filteredCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-white/[0.03]"
                  >
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-emerald-500/10 text-emerald-300">
                      <AdminIcon name="store" size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[13.5px] font-extrabold">{c.name}</b>
                      <span className="mt-1 flex flex-col gap-0.5">
                        {c.rows.map((r) => (
                          <span
                            key={r.source}
                            className="flex items-center justify-between gap-3 text-[11.5px] text-zinc-500"
                          >
                            <span>{r.source}</span>
                            <span className="font-bold text-zinc-400">
                              {r.price !== null ? money(r.price, r.currency) : "—"}
                            </span>
                          </span>
                        ))}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdd(c.id)}
                      disabled={pendingId === c.id}
                      className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] bg-emerald-500 font-black text-[#052e2b] disabled:opacity-50"
                    >
                      <AdminIcon name="plus" size={15} stroke={2.8} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}