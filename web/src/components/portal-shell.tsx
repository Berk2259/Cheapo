"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon, type AdminIconName } from "@/components/admin-icons";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/logo";

type NavItem = {
  href: string;
  label: string;
  icon: AdminIconName;
  premiumOnly?: boolean;
  live?: boolean;
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Takip",
    items: [
      { href: "/portal", label: "Ürünlerim", icon: "package" },
      { href: "/portal/basket", label: "Alışveriş listesi", icon: "cart", premiumOnly: true, live: true },
      { href: "/portal/notifications", label: "Bildirimlerim", icon: "bell" },
      { href: "/portal/requests", label: "Talep gönder", icon: "plus" },
    ],
  },
  {
    label: "Premium",
    items: [
      { href: "/portal/reports", label: "Haftalık rapor", icon: "chart", premiumOnly: true, live: true },
      { href: "/portal/compare", label: "Ürün kıyası", icon: "scale", premiumOnly: true, live: true },
    ],
  },
  {
    label: "Hesap",
    items: [
      { href: "/portal/plan", label: "Planım", icon: "crown" },
      { href: "/portal/account", label: "Hesap ayarları", icon: "settings" },
    ],
  },
];

const titles: Record<string, string> = {
  "/portal": "Ürünlerim",
  "/portal/basket": "Alışveriş listesi",
  "/portal/requests": "Talep gönder",
  "/portal/notifications": "Bildirimlerim",
  "/portal/plan": "Planım",
  "/portal/account": "Hesap ayarları",
  "/portal/reports": "Haftalık rapor",
  "/portal/compare": "Ürün kıyası",
};

const tabs: { href: string; label: string; icon: AdminIconName }[] = [
  { href: "/portal", label: "Ürünlerim", icon: "package" },
  { href: "/portal/requests", label: "Talep", icon: "plus" },
  { href: "/portal/notifications", label: "Bildirim", icon: "bell" },
  { href: "/portal/reports", label: "Premium", icon: "crown" },
  { href: "/portal/plan", label: "Planım", icon: "help" },
];

export function PortalShell({
  name,
  plan,
  bound,
  linkUrl,
  pending,
  children,
}: {
  name: string;
  plan: string;
  bound: boolean;
  linkUrl: string | null;
  pending: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const premium = plan === "premium";
  const initial = (name.trim()[0] ?? "?").toUpperCase();

  function isActive(href: string) {
    return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
  }

  const title = titles[pathname] ?? "Portal";

  const telegramPill = bound ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[12.5px] font-extrabold text-emerald-400">
      <AdminIcon name="send" size={12} stroke={2.4} />
      <span className="hidden sm:inline">Telegram bağlı</span>
      <span className="sm:hidden">Bağlı</span>
    </span>
  ) : linkUrl ? (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[12.5px] font-extrabold text-amber-300 transition hover:bg-amber-400/25"
    >
      <AdminIcon name="alert" size={12} stroke={2.4} />
      Telegram bağlı değil
    </a>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[12.5px] font-extrabold text-amber-300">
      <AdminIcon name="alert" size={12} stroke={2.4} />
      Telegram bağlı değil
    </span>
  );

  const planPill = premium ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[12.5px] font-extrabold text-amber-300">
      <AdminIcon name="crown" size={12} stroke={2.4} /> Premium
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-[12.5px] font-extrabold text-emerald-300">
      Ücretsiz
    </span>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Masaüstü: yan menü */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-zinc-800 bg-[#0c1817] px-3 py-4 md:flex">
        <div className="flex items-center gap-2.5 px-2 pb-3.5 text-[15px] font-extrabold">
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
                const active = isActive(item.href);
                const isRequests = item.href === "/portal/requests";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      "flex items-center gap-[11px] rounded-[10px] px-2.5 py-[9px] text-sm font-semibold transition-all " +
                      (active
                        ? "bg-emerald-500 text-[#052e2b]"
                        : "text-zinc-400 hover:translate-x-0.5 hover:bg-emerald-500/10 hover:text-zinc-50")
                    }
                  >
                    <AdminIcon name={item.icon} />
                    <span>{item.label}</span>
                    {isRequests && pending > 0 && (
                      <span
                        className={
                          "ad-badge ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-extrabold " +
                          (active ? "bg-white text-emerald-700" : "bg-red-500 text-white")
                        }
                      >
                        {pending}
                      </span>
                    )}
                    {item.premiumOnly &&
                      (premium ? (
                        !item.live && (
                          <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-px text-[11px] font-extrabold text-amber-300">
                            Yakında
                          </span>
                        )
                      ) : (
                        <span className="ml-auto text-zinc-500">
                          <AdminIcon name="lock" size={14} />
                        </span>
                      ))}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-zinc-800 pt-3.5">
          <div className="mb-3 flex items-center gap-2.5 px-1.5">
            <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-emerald-500/15 font-extrabold text-emerald-400">
              {initial}
            </span>
            <span className="min-w-0 text-xs">
              <b className="block truncate text-[13.5px] text-zinc-50">{name}</b>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <i
                  className={
                    "h-[7px] w-[7px] rounded-full " +
                    (bound ? "bg-green-400" : "bg-red-400")
                  }
                />
                {bound ? "Telegram bağlı" : "Telegram bağlı değil"}
              </span>
            </span>
          </div>
          <LogoutButton className="w-full" />
        </div>
      </aside>

      {/* İçerik */}
      <div className="md:ml-[248px]">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3.5 md:px-7">
            <span className="flex items-center gap-2 text-[15px] font-extrabold md:hidden">
              <Logo size={32} rounded={10} />
              Cheapo
            </span>
            <h2 className="hidden text-lg font-bold md:block">{title}</h2>
            <div className="ml-auto flex items-center gap-2.5">
              {telegramPill}
              {planPill}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-7">
          {children}
        </main>
      </div>

      {/* Telefon: alt sekmeler */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-zinc-800 bg-[#0c1817] px-2 pb-3.5 pt-2 md:hidden">
        {tabs.map((tab) => {
          const active =
            tab.href === "/portal/reports"
              ? pathname.startsWith("/portal/reports") ||
              pathname.startsWith("/portal/compare")
              : isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold " +
                (active ? "text-emerald-500" : "text-zinc-500")
              }
            >
              {active && (
                <span className="absolute -top-2.5 h-[3px] w-6 rounded-full bg-emerald-500" />
              )}
              <AdminIcon name={tab.icon} size={21} />
              {tab.label}
              {tab.href === "/portal/requests" && pending > 0 && (
                <span className="absolute right-[22%] top-0 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}