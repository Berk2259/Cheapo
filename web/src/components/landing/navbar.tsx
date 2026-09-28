import Link from "next/link";
import { Logo } from "@/components/logo";

export function Navbar({ dark = false }: { dark?: boolean }) {
  return (
    <nav className="flex items-center justify-between py-5">
      <div
        className={`flex items-center gap-2.5 text-[19px] font-extrabold ${dark ? "text-white" : "text-ink"
          }`}
      >
        <Logo size={34} rounded={11} />
        Cheapo
      </div>
      <Link
        href="/login"
        className={`rounded-full border-2 px-6 py-3 text-[15px] font-bold transition hover:-translate-y-0.5 ${dark
            ? "border-white/60 text-white"
            : "border-ink bg-white text-ink"
          }`}
      >
        Giriş yap
      </Link>
    </nav>
  );
}