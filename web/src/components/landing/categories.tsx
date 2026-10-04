import type { ReactNode } from "react";

function Icon({
  size = 22,
  children,
}: {
  size?: number;
  children: ReactNode;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  cart: (
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
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
  plane: (
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  ),
  hotel: (
    <>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </>
  ),
  laptop: (
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
  ),
  shirt: (
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  ),
  fuel: (
    <>
      <line x1="3" x2="15" y1="22" y2="22" />
      <line x1="4" x2="14" y1="9" y2="9" />
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
    </>
  ),
  sparkle: (
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.29 1.29L3 12l5.8 1.9a2 2 0 0 1 1.29 1.29L12 21l1.9-5.8a2 2 0 0 1 1.29-1.29L21 12l-5.8-1.9a2 2 0 0 1-1.29-1.29Z" />
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
};

type IconName = keyof typeof icons;

const categories: { icon: IconName; title: string; text: string }[] = [
  { icon: "package", title: "E-ticaret", text: "İndirim avcılığı" },
  { icon: "plane", title: "Uçak bileti", text: "Bilet fırsatları" },
  { icon: "hotel", title: "Otel", text: "Konaklama fiyatları" },
  { icon: "laptop", title: "Elektronik", text: "Teknoloji ürünleri" },
  { icon: "shirt", title: "Giyim", text: "Moda ve sezon fırsatları" },
  { icon: "fuel", title: "Akaryakıt", text: "Yakıt fiyatları" },
  { icon: "sparkle", title: "Kozmetik", text: "Bakım ve güzellik" },
];

const smallCard =
  "flex min-h-[150px] flex-col justify-between rounded-3xl border border-line bg-white p-5 text-left transition hover:-translate-y-[3px] hover:border-brand hover:shadow-card";

export function Categories() {
  return (
    <section className="py-[70px] text-center">
      <h2 className="mb-3 text-[length:clamp(28px,4vw,42px)] font-extrabold tracking-[-0.025em] text-ink">
        Ne takip etmek istersin?
      </h2>
      <p className="mx-auto mb-11 max-w-[560px] text-[17px] text-muted">
        Kategorini seç, ürünlerini belirle.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:auto-rows-[150px] lg:grid-cols-4">
        <a
          href="/signup"
          className="relative col-span-2 flex min-h-[190px] flex-col justify-between overflow-hidden rounded-3xl border border-brand bg-brand p-[30px] text-left text-white transition hover:bg-brand-dark lg:row-span-2"
        >
          <div className="pointer-events-none absolute -right-[30px] -top-[30px] opacity-[0.12]">
            <Icon size={220}>{icons.cart}</Icon>
          </div>
          <div className="grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-white/20">
            <Icon size={26}>{icons.cart}</Icon>
          </div>
          <div>
            <h3 className="text-[28px] font-bold tracking-tight">Market</h3>
            <p className="text-[15px] text-white/85">Günlük alışveriş</p>
            <span className="mt-3.5 inline-block rounded-xl bg-white px-3 py-2 text-[13px] font-bold text-ink shadow-[0_10px_24px_rgba(0,0,0,0.15)]">
              🔔 Süt 1 L{" "}
              <em className="not-italic text-[#16a34a]">32,90 → 29,50 TL</em>
            </span>
          </div>
        </a>

        {categories.map((c) => (
          <a key={c.title} href="/signup" className={smallCard}>
            <div className="grid h-[42px] w-[42px] place-items-center rounded-[13px] bg-tint text-brand">
              <Icon>{icons[c.icon]}</Icon>
            </div>
            <div>
              <h3 className="text-[16.5px] font-bold text-ink">{c.title}</h3>
              <p className="text-[13px] text-muted">{c.text}</p>
            </div>
          </a>
        ))}

        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=norelsoft@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[150px] flex-col justify-between rounded-3xl border-[1.5px] border-dashed border-brand p-5 text-left text-brand-dark transition hover:bg-white"
        >
          <div className="grid h-[42px] w-[42px] place-items-center rounded-[13px] border-[1.5px] border-dashed border-brand">
            <Icon size={20}>{icons.plus}</Icon>
          </div>
          <div>
            <h3 className="text-[15.5px] font-bold">Listede yok mu?</h3>
            <p className="text-[13px] text-muted">Bize yaz, ekleyelim</p>
          </div>
        </a>
      </div>
    </section>
  );
}