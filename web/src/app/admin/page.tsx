import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { startOfTodayIso, timeAgo } from "@/lib/time";
import { AdminIcon, type AdminIconName } from "@/components/admin-icons";

type Attention = {
  tone: "red" | "amber" | "teal";
  icon: AdminIconName;
  title: string;
  text: string;
  href: string;
  cta: string;
};

const toneClass = {
  red: "bg-red-500/15 text-red-400",
  amber: "bg-amber-400/15 text-amber-300",
  teal: "bg-emerald-500/15 text-emerald-400",
};

const cardClass = "rounded-2xl border border-zinc-800 bg-zinc-900";

function isError(status: string | null) {
  return !!status && !status.startsWith("ok");
}

export default async function AdminHomePage() {
  const supabase = await createClient();

  const [
    customers,
    products,
    subscriptions,
    requests,
    notifToday,
    notifTotal,
    recent,
  ] = await Promise.all([
    supabase.from("customers").select("id, name, telegram_chat_id, is_active"),
    supabase
      .from("products")
      .select("id, name, is_active, last_status, last_checked_at"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }),
    supabase
      .from("customer_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "bekliyor"),
    supabase
      .from("notification_log")
      .select("*", { count: "exact", head: true })
      .gte("sent_at", startOfTodayIso()),
    supabase.from("notification_log").select("*", { count: "exact", head: true }),
    supabase
      .from("notification_log")
      .select("id, customer_id, product_id, message, sent_at")
      .order("sent_at", { ascending: false })
      .limit(5),
  ]);

  const failed = [
    customers,
    products,
    subscriptions,
    requests,
    notifToday,
    notifTotal,
    recent,
  ].some((r) => r.error);

  const customerList = customers.data ?? [];
  const productList = products.data ?? [];

  const unbound = customerList.filter(
    (c) => c.is_active && !c.telegram_chat_id,
  ).length;
  const bound = customerList.filter((c) => c.telegram_chat_id).length;
  const failing = productList.filter(
    (p) => p.is_active && isError(p.last_status),
  );
  const activeCount = productList.filter((p) => p.is_active).length;

  const lastChecked =
    productList
      .map((p) => p.last_checked_at)
      .filter((v): v is string => !!v)
      .sort()
      .at(-1) ?? null;

  // Dikkat gerektirenler: yalnızca sayısı 0'dan büyük olanlar listelenir.
  const attention: Attention[] = [];
  if (failing.length > 0) {
    const names = failing.slice(0, 2).map((p) => p.name).join(", ");
    attention.push({
      tone: "red",
      icon: "alert",
      title: `${failing.length} üründe fiyat okunamadı`,
      text: failing.length > 2 ? `${names} ve diğerleri` : names,
      href: "/admin/products",
      cta: "Ürünlere git",
    });
  }
  if ((requests.count ?? 0) > 0) {
    attention.push({
      tone: "amber",
      icon: "mail",
      title: `${requests.count} müşteri talebi inceleme bekliyor`,
      text: "Müşteri portalından geldi",
      href: "/admin/customer-requests",
      cta: "Talepleri aç",
    });
  }
  if (unbound > 0) {
    attention.push({
      tone: "teal",
      icon: "send",
      title: `${unbound} müşteri Telegram'a bağlanmamış`,
      text: "Bağlanana kadar bildirim gidemez",
      href: "/admin/customers",
      cta: "Müşterilere git",
    });
  }

  const stats: {
    label: string;
    value: number;
    text: string;
    icon: AdminIconName;
    href: string;
  }[] = [
    {
      label: "Müşteriler",
      value: customerList.length,
      text: `${bound} Telegram'a bağlı`,
      icon: "users",
      href: "/admin/customers",
    },
    {
      label: "Ürünler",
      value: productList.length,
      text: `${activeCount} aktif`,
      icon: "package",
      href: "/admin/products",
    },
    {
      label: "Takipler",
      value: subscriptions.count ?? 0,
      text: "müşteri-ürün eşleşmesi",
      icon: "eye",
      href: "/admin/subscriptions",
    },
    {
      label: "Bugünkü bildirim",
      value: notifToday.count ?? 0,
      text: `toplam ${notifTotal.count ?? 0}`,
      icon: "bell",
      href: "/admin/notifications",
    },
  ];

  const statusRows = [
    {
      label: "Güncel",
      count: productList.filter(
        (p) => p.is_active && p.last_status?.startsWith("ok"),
      ).length,
      color: "#2dd4bf",
    },
    {
      label: "Sırada",
      count: productList.filter((p) => p.is_active && !p.last_status).length,
      color: "#f59e0b",
    },
    { label: "Okunamadı", count: failing.length, color: "#ef4444" },
    {
      label: "Pasif",
      count: productList.filter((p) => !p.is_active).length,
      color: "#94a3b8",
    },
  ];
  const total = productList.length || 1;

  const customerName = (id: number) =>
    customerList.find((c) => c.id === id)?.name ?? "-";
  const productName = (id: number | null) =>
    id === null
      ? "(silinmiş ürün)"
      : (productList.find((p) => p.id === id)?.name ?? "-");

  return (
    <div>
      <div className="ad-in mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
            Hoş geldin 👋
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Fiyat takip sisteminin bugünkü durumu.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-1.5 rounded-[11px] border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm font-bold text-zinc-50 transition hover:-translate-y-0.5 hover:border-emerald-500"
          >
            <AdminIcon name="plus" size={16} /> Müşteri
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 rounded-[11px] bg-emerald-500 px-3.5 py-2 text-sm font-bold text-[#052e2b] transition hover:-translate-y-0.5"
          >
            <AdminIcon name="plus" size={16} /> Ürün ekle
          </Link>
        </div>
      </div>

      {failed && (
        <p className="mb-4 text-sm text-red-500">
          Bazı veriler alınamadı, sayılar eksik olabilir.
        </p>
      )}

      {/* Dikkat gerektirenler */}
      {attention.length > 0 ? (
        <div
          className="ad-in mb-5 rounded-2xl border border-red-500/25 bg-[linear-gradient(180deg,rgba(248,113,113,0.1),#101e1d_70%)] p-[18px]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-red-400">
            <AdminIcon name="alert" size={18} />
            Dikkat gerektirenler
            <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs">
              {attention.length}
            </span>
          </h3>
          <div className="mt-2">
            {attention.map((a) => (
              <div
                key={a.title}
                className="flex items-center gap-3 border-t border-zinc-800 py-2.5 first:border-t-0"
              >
                <span
                  className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px] ${toneClass[a.tone]}`}
                >
                  <AdminIcon name={a.icon} size={17} />
                </span>
                <span className="flex-1">
                  <b className="block text-sm text-zinc-50">{a.title}</b>
                  <small className="text-zinc-500">{a.text}</small>
                </span>
                <Link
                  href={a.href}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-emerald-500 transition-all hover:gap-2.5"
                >
                  {a.cta} <AdminIcon name="arrow" size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="ad-in mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-[18px]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-emerald-500/15 text-emerald-400">
            <AdminIcon name="check" size={18} stroke={3} />
          </span>
          <span>
            <b className="block text-sm text-zinc-50">Her şey yolunda</b>
            <small className="text-zinc-500">Bekleyen iş ya da hata yok.</small>
          </span>
        </div>
      )}

      {/* İstatistikler */}
      <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Link
            key={s.label}
            href={s.href}
            className={`ad-in ${cardClass} block p-[18px] transition hover:-translate-y-1 hover:border-emerald-500`}
            style={{ "--i": i + 2 } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
              <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-emerald-500/15 text-emerald-500">
                <AdminIcon name={s.icon} size={16} />
              </span>
              {s.label}
            </div>
            <div className="mt-2 text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-zinc-50">
              {s.value}
            </div>
            <div className="text-[12.5px] font-semibold text-zinc-500">
              {s.text}
            </div>
          </Link>
        ))}
      </div>

      {/* Son bildirimler ve ürün durumu */}
      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div
          className={`ad-in ${cardClass} p-[18px]`}
          style={{ "--i": 6 } as React.CSSProperties}
        >
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-zinc-50">
            <AdminIcon name="bell" size={17} /> Son bildirimler
            <Link
              href="/admin/notifications"
              className="ml-auto inline-flex items-center gap-1 text-[13px] font-bold text-emerald-500"
            >
              Tümü <AdminIcon name="arrow" size={14} />
            </Link>
          </h3>
          <div className="mt-2">
            {(recent.data ?? []).map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-3 border-t border-zinc-800 py-2.5 first:border-t-0"
              >
                <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <AdminIcon name="send" size={16} />
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <b className="text-zinc-50">{productName(n.product_id)}</b>{" "}
                  <span className="text-zinc-500">
                    → {customerName(n.customer_id)}
                  </span>
                  <small className="block truncate text-zinc-500">
                    {n.message.split("\n")[0]}
                  </small>
                </span>
                <small className="whitespace-nowrap text-zinc-500">
                  {timeAgo(n.sent_at)}
                </small>
              </div>
            ))}
            {(recent.data ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500">
                Henüz bildirim gönderilmedi.
              </p>
            )}
          </div>
        </div>

        <div
          className={`ad-in ${cardClass} p-[18px]`}
          style={{ "--i": 7 } as React.CSSProperties}
        >
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-zinc-50">
            <AdminIcon name="package" size={17} /> Ürün durumu
          </h3>
          <div className="mt-3.5 grid gap-3">
            {statusRows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-[86px_1fr_26px] items-center gap-2.5 text-[13px] text-zinc-300"
              >
                <span>{r.label}</span>
                <div className="h-[9px] overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="ad-grow h-full rounded-full"
                    style={{
                      width: `${(r.count / total) * 100}%`,
                      background: r.color,
                    }}
                  />
                </div>
                <b className="text-zinc-50">{r.count}</b>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-zinc-500">
            {lastChecked
              ? `En son kontrol: ${timeAgo(lastChecked)}`
              : "Henüz kontrol edilen ürün yok."}
          </p>
        </div>
      </div>
    </div>
  );
}