"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import { UsageMeter } from "@/components/usage-meter";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { submitCustomerRequest } from "@/app/portal/actions";

type Category = { id: number; name: string; productCount: number };
type Product = {
  id: number;
  name: string;
  category_id: number;
  current_price: number | null;
  currency: string;
  source: string;
};

type Confetti = { color: string; x: number; y: number; r: number; delay: number };

const confettiColors = ["#2dd4bf", "#5eead4", "#f59e0b", "#38bdf8", "#f472b6", "#a78bfa"];

function makeConfetti(): Confetti[] {
  return Array.from({ length: 22 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 110;
    return {
      color: confettiColors[i % confettiColors.length],
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 10,
      r: Math.random() * 720 - 360,
      delay: 0.3 + Math.random() * 0.15,
    };
  });
}

// Kategori adına göre emoji; bilinmeyenler için genel bir simge.
function emojiFor(name: string) {
  const n = name.toLocaleLowerCase("tr");
  if (n.includes("market")) return "🛒";
  if (n.includes("ticaret")) return "🛍️";
  if (n.includes("uçak") || n.includes("bilet")) return "✈️";
  if (n.includes("otel")) return "🏨";
  if (n.includes("elektronik")) return "💻";
  if (n.includes("giyim")) return "👕";
  if (n.includes("akaryakıt")) return "⛽";
  if (n.includes("kozmetik")) return "✨";
  return "🏷️";
}

function money(value: number, currency: string) {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-2.5 font-extrabold">
      <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-emerald-500 text-[13px] text-[#052e2b]">
        {n}
      </span>
      {children}
    </div>
  );
}

export function CustomerRequestForm({
  categories,
  products,
  followedProductIds,
  followedCategoryIds,
  plan,
}: {
  categories: Category[];
  products: Product[];
  followedProductIds: number[];
  followedCategoryIds: number[];
  plan: string;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0);
  const [productIds, setProductIds] = useState<number[]>([]);
  const [settings, setSettings] = useState<
    Record<number, { notify: boolean; target: string }>
  >({});
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [pending, startTransition] = useTransition();

  const premium = plan === "premium";
  const limits = premium ? PLAN_LIMITS.premium : PLAN_LIMITS.free;

  const followedProducts = useMemo(
    () => new Set(followedProductIds),
    [followedProductIds],
  );
  const followedCategories = useMemo(
    () => new Set(followedCategoryIds),
    [followedCategoryIds],
  );

  const filteredProducts = useMemo(
    () => products.filter((p) => p.category_id === categoryId),
    [products, categoryId],
  );

  const category = categories.find((c) => c.id === categoryId);

  // Sunucudaki plan kontrolüyle aynı hesap: takipteki + yeni seçilenler.
  const newSelected = productIds.filter((id) => !followedProducts.has(id));
  const productsAfter = followedProducts.size + newSelected.length;
  const categoriesAfter = new Set([
    ...followedCategories,
    ...(newSelected.length > 0 ? [categoryId] : []),
  ]).size;
  const over =
    !premium &&
    (productsAfter > limits.maxProducts ||
      categoriesAfter > limits.maxCategories);

  function toggleProduct(id: number) {
    setProductIds((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id],
    );
    setSettings((current) => {
      if (current[id]) return current;
      return { ...current, [id]: { notify: true, target: "" } };
    });
  }

  function setNotify(id: number, notify: boolean) {
    setSettings((current) => ({
      ...current,
      [id]: { notify, target: current[id]?.target ?? "" },
    }));
  }

  function setTarget(id: number, target: string) {
    setSettings((current) => ({
      ...current,
      [id]: { notify: current[id]?.notify ?? true, target },
    }));
  }

  function submit() {
    startTransition(async () => {
      const result = await submitCustomerRequest({
        categoryId,
        products: newSelected.map((id) => ({
          productId: id,
          targetPrice: settings[id]?.target ?? "",
          notifyOnAnyChange: settings[id]?.notify ?? true,
        })),
        note,
      });
      if (result.ok) {
        setConfetti(makeConfetti());
        setSent(true);
        setProductIds([]);
        setSettings({});
        setNote("");
        setMessage(null);
      } else {
        setMessage(result.message ?? "Gönderilemedi.");
      }
    });
  }

  if (categories.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        Şu an seçilebilecek kategori yok.
      </p>
    );
  }

  if (sent) {
    return (
      <div className="lf-done relative mt-4 rounded-[20px] border border-zinc-800 bg-zinc-900 px-5 py-9 text-center">
        {confetti.map((c, i) => (
          <i
            key={i}
            className="lf-cf"
            style={
              {
                background: c.color,
                "--x": `${c.x}px`,
                "--y": `${c.y}px`,
                "--r": `${c.r}deg`,
                animationDelay: `${c.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
        <div className="lf-bigck mx-auto grid h-[78px] w-[78px] place-items-center rounded-full bg-emerald-500 text-[#052e2b]">
          <AdminIcon name="check" size={40} stroke={3} />
        </div>
        <h3 className="mt-3.5 text-[21px] font-bold">Talebin bize ulaştı 🎉</h3>
        <p className="mt-1 text-zinc-500">
          Ekibimiz inceleyecek. Durumunu aşağıdaki &quot;Taleplerim&quot;den
          takip edebilirsin.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-[13px] font-extrabold text-[#052e2b] transition hover:-translate-y-0.5"
        >
          Yeni talep gönder
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Kullanım */}
      <div className="mt-4 rounded-[20px] border border-zinc-800 bg-zinc-900 p-[18px]">
        <div className="flex items-center gap-2.5">
          <b>Kullanımın</b>
          {premium ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[12.5px] font-extrabold text-amber-300">
              <AdminIcon name="crown" size={13} stroke={2.4} /> Premium · sınırsız
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[12.5px] font-extrabold text-emerald-300">
              Ücretsiz
            </span>
          )}
        </div>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <UsageMeter
            label="Kategori"
            used={followedCategories.size}
            max={limits.maxCategories}
            extra={categoriesAfter - followedCategories.size}
          />
          <UsageMeter
            label="Ürün"
            used={followedProducts.size}
            max={limits.maxProducts}
            extra={newSelected.length}
          />
        </div>
      </div>

      {/* 1. Kategori */}
      <Step n={1}>Kategori seç</Step>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((c) => {
          const on = c.id === categoryId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategoryId(c.id);
                setProductIds([]);
              }}
              className={
                "rounded-[18px] border-2 p-4 text-center transition hover:-translate-y-1 hover:border-emerald-500 " +
                (on
                  ? "border-emerald-500 bg-emerald-500/10 shadow-[0_14px_30px_-14px_rgba(45,212,191,0.6)]"
                  : "border-zinc-800 bg-zinc-900")
              }
            >
              <span
                className={
                  "block text-[30px] transition-transform " +
                  (on ? "scale-[1.15] -rotate-6" : "")
                }
              >
                {emojiFor(c.name)}
              </span>
              <b className="mt-1 block">{c.name}</b>
              <small className="text-zinc-500">{c.productCount} ürün</small>
            </button>
          );
        })}
      </div>

      {/* 2. Ürünler */}
      <Step n={2}>{category?.name} kategorisinden ürünleri seç</Step>
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-800 p-5 text-center text-zinc-500">
          Bu kategoride henüz ürün yok.
          <br />
          <small>Yakında eklenecek, dilersen not bırakabilirsin.</small>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {filteredProducts.map((p) => {
            const followed = followedProducts.has(p.id);
            const on = productIds.includes(p.id);
            const s = settings[p.id] ?? { notify: true, target: "" };
            return (
              <div
                key={p.id}
                className={
                  "rounded-2xl border-2 transition " +
                  (on
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900")
                }
              >
                <button
                  type="button"
                  disabled={followed}
                  onClick={() => toggleProduct(p.id)}
                  className="flex w-full items-center gap-3.5 px-3.5 py-3 text-left transition disabled:opacity-50"
                >
                  <span
                    className={
                      "grid h-6 w-6 flex-none place-items-center rounded-lg border-2 transition " +
                      (on
                        ? "scale-110 border-emerald-500 bg-emerald-500 text-[#052e2b]"
                        : "border-zinc-700 text-transparent")
                    }
                  >
                    <AdminIcon name="check" size={14} stroke={3.4} />
                  </span>
                  <span className="flex-1 font-bold">
                    {p.name}
                    {p.source && (
                      <small className="ml-1.5 font-semibold text-zinc-500">
                        · {p.source}
                      </small>
                    )}
                  </span>
                  {followed ? (
                    <span className="rounded-full bg-green-400/15 px-2.5 py-0.5 text-xs font-extrabold text-green-400">
                      Zaten takipte
                    </span>
                  ) : (
                    p.current_price !== null && (
                      <span className="font-extrabold tabular-nums">
                        {money(Number(p.current_price), p.currency)}
                      </span>
                    )
                  )}
                </button>

                {on && !followed && (
                  <div className="flex flex-wrap items-center gap-3.5 border-t border-emerald-500/20 px-3.5 py-3">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300">
                      <input
                        type="checkbox"
                        checked={s.notify}
                        onChange={(e) => setNotify(p.id, e.target.checked)}
                        className="h-4 w-4 accent-emerald-500"
                      />
                      Her değişimde bildir
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300">
                      Hedef fiyat
                      <input
                        type="text"
                        inputMode="decimal"
                        value={s.target}
                        onChange={(e) => setTarget(p.id, e.target.value)}
                        placeholder="opsiyonel"
                        className="w-28 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-50 outline-none focus:border-emerald-500"
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Plan sınırı uyarısı */}
      {over && (
        <div className="ad-in mt-3.5 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-400/10 px-4 py-3.5 font-semibold text-amber-300">
          <AdminIcon name="alert" size={22} />
          <span className="min-w-0 flex-1">
            <b className="text-zinc-50">Ücretsiz plan sınırı:</b> en fazla{" "}
            {limits.maxCategories} kategori ve {limits.maxProducts} ürün takip
            edilebilir. Şu an {followedCategories.size} kategori,{" "}
            {followedProducts.size} ürün takip ediyorsun.
          </span>
          <Link
            href="/portal/plan"
            className="rounded-xl bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-3 py-1.5 text-[13px] font-extrabold text-[#3b2a00]"
          >
            Premium&apos;u incele
          </Link>
        </div>
      )}

      {/* 3. Not */}
      <Step n={3}>
        Not{" "}
        <small className="font-medium text-zinc-500">(isteğe bağlı)</small>
      </Step>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Eklemek istediğin bir şey var mı?"
        className="w-full resize-none rounded-2xl border-2 border-zinc-800 bg-zinc-900 px-3.5 py-3 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500 focus:shadow-[0_0_0_5px_rgba(45,212,191,0.13)]"
      />

      {message && <p className="mt-3 text-sm text-red-500">{message}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13.5px] text-zinc-500">
          {newSelected.length > 0
            ? `${newSelected.length} ürün seçili`
            : "Henüz ürün seçmedin"}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={pending || newSelected.length === 0 || over}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-extrabold text-[#052e2b] shadow-[0_10px_22px_-10px_#2dd4bf] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
        >
          {pending ? "Gönderiliyor…" : "Talebi gönder"}
          <AdminIcon name="send" size={16} />
        </button>
      </div>
    </div>
  );
}