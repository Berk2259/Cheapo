import { PLAN_LIMITS } from "@/lib/plan-limits";
import { PlanReveal } from "@/components/landing/plan-reveal";

const free = PLAN_LIMITS.free;

type Item = { lead?: string; text: string; soon?: boolean };

const freeItems: Item[] = [
  { lead: String(free.maxCategories), text: "kategori" },
  { lead: String(free.maxProducts), text: "ürün takibi" },
  { text: "Telegram bildirimi" },
  { text: "Hedef fiyat ve her değişimde bildirim" },
];

const premiumItems: Item[] = [
  { lead: "Sınırsız", text: "kategori" },
  { lead: "Sınırsız", text: "ürün takibi" },
  { text: "Telegram bildirimi" },
  { text: "Hedef fiyat ve her değişimde bildirim" },
  { text: "Öncelikli destek" },
  { text: "Satıcılar arası fiyat kıyaslama" },
  { text: "Haftalık ve aylık rapor ve analiz" },
  { text: "Alışveriş listesi ve satıcı kıyası" },
];
const iconPaths = {
  milk: (
    <>
      <path d="M8 2h8" />
      <path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2" />
      <path d="M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0" />
    </>
  ),
  coffee: (
    <>
      <path d="M10 2v2" />
      <path d="M14 2v2" />
      <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
      <path d="M6 2v2" />
    </>
  ),
  headphones: (
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
  ),
  shirt: (
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  ),
  keyboard: (
    <>
      <path d="M10 8h.01" />
      <path d="M12 12h.01" />
      <path d="M14 8h.01" />
      <path d="M16 12h.01" />
      <path d="M18 8h.01" />
      <path d="M6 8h.01" />
      <path d="M7 16h10" />
      <path d="M8 12h.01" />
      <rect width="20" height="16" x="2" y="4" rx="2" />
    </>
  ),
  sparkle: (
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.29 1.29L3 12l5.8 1.9a2 2 0 0 1 1.29 1.29L12 21l1.9-5.8a2 2 0 0 1 1.29-1.29L21 12l-5.8-1.9a2 2 0 0 1-1.29-1.29Z" />
  ),
  lock: (
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
};

type IconName = keyof typeof iconPaths;

function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

const freeIcons: IconName[] = ["milk", "coffee", "headphones"];
const flowIcons: IconName[] = [
  "milk",
  "coffee",
  "headphones",
  "shirt",
  "keyboard",
  "sparkle",
];

function delay(name: string, value: number) {
  return { [name]: value } as React.CSSProperties;
}

function Check({ hot }: { hot?: boolean }) {
  return (
    <span
      className={
        "pl-ck grid h-5 w-5 flex-none place-items-center rounded-full " +
        (hot ? "bg-brand-light/15 text-brand-light" : "bg-tint text-brand")
      }
    >
      <svg
        viewBox="0 0 24 24"
        width={12}
        height={12}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function FeatureList({ items, hot }: { items: Item[]; hot?: boolean }) {
  return (
    <ul className="relative z-[1] grid gap-3 text-[15px]">
      {items.map((item, i) => (
        <li
          key={item.text}
          className="flex items-center gap-[11px]"
          style={delay("--k", i)}
        >
          <Check hot={hot} />
          <span className="pl-tx flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {item.lead && <b>{item.lead} </b>}
              {item.text}
            </span>
            {item.soon && (
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[11px] font-bold " +
                  (hot
                    ? "bg-brand-light/15 text-brand-light"
                    : "bg-tint text-brand")
                }
              >
                Yakında
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

const slotBase =
  "pl-slot grid h-[54px] w-[54px] flex-none place-items-center rounded-2xl";

export function Plans() {
  return (
    <section id="planlar" className="py-[70px] text-center">
      <h2 className="mb-3 text-[length:clamp(28px,4vw,42px)] font-extrabold tracking-[-0.025em] text-ink">
        Sana uygun planı seç
      </h2>
      <p className="mx-auto mb-11 max-w-[560px] text-[17px] text-muted">
        Ücretsiz başla, ihtiyacın büyüyünce Premium&apos;a geç.
      </p>

      <PlanReveal>
        <div className="mx-auto grid max-w-[880px] grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* Ücretsiz */}
          <div className="pl-rv flex" style={delay("--i", 0)}>
            <div className="flex flex-1 flex-col rounded-[30px] border border-line bg-white p-[34px] text-left text-ink transition-shadow hover:shadow-[0_26px_54px_rgba(13,148,136,0.16)]">
              <h3 className="text-xl font-bold">Ücretsiz</h3>
              <p className="mt-0.5 text-[14.5px] text-muted">
                Denemek ve küçük başlamak için
              </p>
              <div className="mb-1 mt-[18px] text-[46px] font-extrabold leading-[1.05] tracking-[-0.03em]">
                0 ₺{" "}
                <small className="text-[15px] font-semibold tracking-normal text-muted">
                  / süresiz
                </small>
              </div>

              <div className="mb-1 mt-1.5 flex gap-2.5">
                {freeIcons.map((name, i) => (
                  <div
                    key={name}
                    className={slotBase + " bg-tint text-brand"}
                    style={delay("--s", i)}
                  >
                    <Icon name={name} />
                  </div>
                ))}
                <div
                  className={
                    slotBase +
                    " pl-lock border-2 border-dashed border-[#b3c5c2] text-[#93a8a5]"
                  }
                  style={delay("--s", freeIcons.length)}
                >
                  <Icon name="lock" />
                </div>
              </div>
              <div className="mt-2.5 flex justify-between text-[13.5px] font-semibold text-muted">
                <span>Ürün limiti</span>
                <b className="text-ink">
                  {free.maxProducts} / {free.maxProducts} dolu
                </b>
              </div>
              <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-line">
                <div className="pl-bar h-full rounded-full bg-[linear-gradient(90deg,#0d9488,#5eead4)]" />
              </div>
              <p className="pl-hint mt-2 text-[12.5px] font-bold text-[#c2410c]">
                Limit doldu, daha fazlası için Premium
              </p>

              <hr className="my-[22px] border-line" />
              <FeatureList items={freeItems} />
              <div className="mt-auto pt-7">
                <a
                  href="/signup"
                  className="pl-shine block rounded-full border-2 border-ink bg-white px-[22px] py-[13px] text-center text-[15px] font-bold text-ink transition hover:-translate-y-0.5"
                >
                  Ücretsiz başla
                </a>
              </div>
            </div>
          </div>

          {/* Premium */}
          <div className="pl-rv flex" style={delay("--i", 1)}>
            <div className="relative flex flex-1 flex-col overflow-hidden rounded-[30px] border border-ink bg-ink p-[34px] text-left text-white shadow-strong">
              <div className="pointer-events-none absolute -right-[90px] -top-[90px] h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(94,234,212,0.35),transparent_65%)]" />
              <span className="absolute right-[22px] top-[22px] z-[2] rounded-full bg-brand-light px-3 py-[5px] text-xs font-extrabold text-ink">
                Önerilen
              </span>

              <h3 className="text-xl font-bold">Premium</h3>
              <p className="mt-0.5 text-[14.5px] text-[#a9cdc7]">
                Büyüyen ihtiyaçlar için
              </p>
              <div className="mb-1 mt-[18px] text-[46px] font-extrabold leading-[1.05] tracking-[-0.03em]">
                Talep üzerine
              </div>

              <div className="pl-marquee mb-1 mt-1.5">
                <div className="pl-track">
                  {[0, 1].map((copy) =>
                    flowIcons.map((name) => (
                      <div
                        key={`${copy}-${name}`}
                        aria-hidden={copy === 1}
                        className="grid h-[54px] w-[54px] flex-none place-items-center rounded-2xl bg-brand-light/15 text-brand-light"
                      >
                        <Icon name={name} />
                      </div>
                    )),
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex justify-between text-[13.5px] font-semibold text-[#a9cdc7]">
                <span>Ürün limiti</span>
                <b className="text-brand-light">Sınırsız ∞</b>
              </div>

              <hr className="my-[22px] border-white/15" />
              <FeatureList items={premiumItems} hot />
              <div className="mt-auto pt-7">
                <a
                  href="/signup"
                  className="pl-shine block rounded-full border-2 border-brand-light bg-brand-light px-[22px] py-[13px] text-center text-[15px] font-bold text-ink shadow-[0_12px_30px_rgba(94,234,212,0.3)] transition hover:-translate-y-0.5"
                >
                  Premium için yaz
                </a>
              </div>
            </div>
          </div>
        </div>
      </PlanReveal>
    </section>
  );
}