"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/logo";

const icons = {
  home: (
    <>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  mail: (
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  tag: (
    <>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </>
  ),
  package: (
    <>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  eye: (
    <>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </>
  ),
  bell: (
    <>
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </>
  ),
  trend: (
    <>
      <path d="M16 17h6v-6" />
      <path d="m22 17-8.5-8.5-5 5L2 7" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
};

type IconName = keyof typeof icons;

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-none"
    >
      {icons[name]}
    </svg>
  );
}

type Item = { href: string; label: string; icon: IconName };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Genel",
    items: [{ href: "/admin", label: "Ana sayfa", icon: "home" }],
  },
  {
    label: "Gelenler",
    items: [
      { href: "/admin/leads", label: "Talepler", icon: "inbox" },
      { href: "/admin/customer-requests", label: "Müşteri talepleri", icon: "mail" },
    ],
  },
  {
    label: "Katalog",
    items: [
      { href: "/admin/customers", label: "Müşteriler", icon: "users" },
      { href: "/admin/categories", label: "Kategoriler", icon: "tag" },
      { href: "/admin/sources", label: "Kaynaklar", icon: "globe" },
      { href: "/admin/products", label: "Ürünler", icon: "package" },
    ],
  },
  {
    label: "Takip",
    items: [
      { href: "/admin/subscriptions", label: "Takipler", icon: "eye" },
      { href: "/admin/price-history", label: "Fiyat geçmişi", icon: "chart" },
      { href: "/admin/notifications", label: "Bildirimler", icon: "bell" },
    ],
  },
  {
    label: "Sistem",
    items: [{ href: "/admin/trash", label: "Çöp kutusu", icon: "trash" }],
  },
];

export function Sidebar({
  email,
  badges = {},
}: {
  email: string | undefined;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const initial = (email?.trim()[0] ?? "A").toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-zinc-800 bg-[#0c1817] px-3 py-4 text-zinc-400">
      <div className="flex items-center gap-2.5 px-2 pb-4 text-[15px] font-extrabold text-zinc-50">
        <Logo size={32} rounded={10} />
        Cheapo
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 pb-1.5 pt-3.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-zinc-500">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const count = badges[item.href] ?? 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "flex items-center gap-[11px] rounded-[10px] px-2.5 py-[9px] text-sm font-semibold transition-all " +
                    (active
                      ? "bg-emerald-500 text-[#052e2b]"
                      : "hover:translate-x-0.5 hover:bg-emerald-500/10 hover:text-zinc-50")
                  }
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {count > 0 && (
                    <span
                      className={
                        "ad-badge ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-extrabold " +
                        (active
                          ? "bg-white text-emerald-700"
                          : "bg-red-500 text-white")
                      }
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-800 pt-3.5">
        <div className="mb-3 flex items-center gap-2.5 px-2">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-emerald-500/15 font-extrabold text-emerald-500">
            {initial}
          </span>
          <span className="min-w-0 text-xs">
            <b className="block text-[13px] text-zinc-50">Yönetici</b>
            <span className="block truncate text-zinc-500">{email}</span>
          </span>
        </div>
        <LogoutButton className="w-full" />
      </div>
    </aside>
  );
}