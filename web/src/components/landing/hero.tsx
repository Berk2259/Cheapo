import { Navbar } from "@/components/landing/navbar";
import { HeroDevices } from "@/components/landing/hero-devices";
import { HeroWall } from "@/components/landing/hero-wall";

const trust = ["Kart gerekmez", "Ücretsiz plan", "1 dakikada talep"];

export function Hero() {
  return (
    <header className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#041c19,#0d2b29_60%,#0a3b35)] text-white">
      <div className="pointer-events-none absolute -right-[100px] -top-10 -z-10 h-[720px] w-[720px] bg-[radial-gradient(circle,rgba(45,212,191,0.3),transparent_65%)]" />

      <div className="mx-auto max-w-[1920px] px-[22px] md:px-8 xl:px-[4vw]">
        <Navbar dark />

        <div className="grid items-center gap-2.5 pb-[46px] pt-[30px] lg:grid-cols-[0.62fr_1.38fr]">
          <div>
            <span className="mb-5 inline-block rounded-full border border-white/15 bg-white/[0.08] px-[15px] py-[7px] text-[13.5px] font-semibold text-brand-light">
              ✨ Fiyat değişince Telegram&apos;a mesaj gelir
            </span>

            <h1 className="text-[length:clamp(32px,3.6vw,48px)] font-extrabold leading-[1.06] tracking-[-0.035em]">
              İndirimi <span className="text-brand-light">kaçırma</span>, fiyat
              düşünce haberin olsun.
            </h1>

            <p className="mb-7 mt-5 max-w-[420px] text-[17px] text-[#a9cdc7]">
              Takip etmek istediğin ürünleri söyle, gerisini bize bırak. Fiyat
              değiştiği an Telegram&apos;dan haber verelim.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/signup"
                className="rounded-full border-2 border-brand-light bg-brand-light px-[26px] py-[14px] text-[15px] font-bold text-ink shadow-[0_12px_34px_rgba(94,234,212,0.35)] transition hover:-translate-y-0.5"
              >
                Hemen başla — ücretsiz
              </a>
              <a
                href="#nasil"
                className="rounded-full border-2 border-white/55 px-[26px] py-[14px] text-[15px] font-bold text-white transition hover:-translate-y-0.5"
              >
                Nasıl çalışır?
              </a>
            </div>

            <ul className="mt-[22px] flex flex-wrap gap-4 text-[13.5px] font-semibold text-[#a9cdc7]">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="font-extrabold text-brand-light">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <HeroDevices />
          </div>
        </div>
      </div>

      <HeroWall />
    </header>
  );
}