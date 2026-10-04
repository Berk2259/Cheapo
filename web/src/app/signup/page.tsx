"use client";

import { useState } from "react";
import { AdminIcon } from "@/components/admin-icons";
import { LoginShowcase } from "@/components/login-showcase";
import { Logo } from "@/components/logo";
import { signUpCustomer } from "@/app/actions";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signUpCustomer({ name, email, password });
    if (!result.ok) {
      setError(result.message ?? "Hesap oluşturulamadı.");
      setLoading(false);
    }
    // Başarılıysa signUpCustomer sunucu tarafında /portal'a yönlendirir.
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070d0c] px-4 py-10">
      <LoginShowcase />

      <div className="relative z-[3] flex w-full max-w-[1000px] overflow-hidden rounded-[26px] border border-emerald-500/20 shadow-[0_40px_90px_rgba(0,0,0,0.55)] max-lg:max-w-[440px] max-lg:flex-col">
        {/* Sol: tanıtım */}
        <div className="relative flex-1 overflow-hidden bg-[linear-gradient(155deg,#0f766e,#0d2b29_65%,#081e1c)] p-11 text-white max-lg:hidden">
          <div className="pointer-events-none absolute -right-[70px] -top-[70px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.28),transparent_65%)]" />
          <div className="relative">
            <div className="flex items-center gap-2.5 text-base font-extrabold">
              <Logo size={34} rounded={11} />
              Cheapo
            </div>
            <h2 className="mt-11 max-w-[320px] text-[28px] font-extrabold leading-[1.28] tracking-[-0.02em]">
              30 saniyede kaydol, hemen takibe başla.
            </h2>
            <p className="mt-2.5 max-w-[300px] text-[14.5px] text-[#bfe6e0]">
              Kredi kartı gerekmez. Ücretsiz planla hemen başlarsın, istersen
              sonra Premium&apos;a geçersin.
            </p>
            <div className="mt-[34px] grid gap-[15px]">
              {[
                {
                  icon: "target" as const,
                  title: "Hedef fiyat",
                  text: "Belirlediğin fiyata inince haber al",
                },
                {
                  icon: "bell" as const,
                  title: "Anlık bildirim",
                  text: "Her değişimde ya da hedefte, sen seç",
                },
                {
                  icon: "shield" as const,
                  title: "Güvenli giriş",
                  text: "Bilgilerin yalnızca sana özel",
                },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-[11px]">
                  <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-emerald-400/15 text-emerald-300">
                    <AdminIcon name={f.icon} size={16} />
                  </span>
                  <span>
                    <b className="block text-sm">{f.title}</b>
                    <small className="text-[#a9cdc7]">{f.text}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: form */}
        <div className="flex flex-none items-center bg-[#0e1c1a] p-12 lg:w-[440px]">
          <form onSubmit={handleSubmit} className="w-full">
            <span className="mb-[18px] block">
              <Logo size={40} rounded={12} />
            </span>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
              Hesabını oluştur
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              30 saniyede kaydol, hemen ürün takibine başla.
            </p>

            <div className="relative mt-4">
              <span className="pointer-events-none absolute left-3.5 top-[19px] text-zinc-500">
                <AdminIcon name="users" size={16} />
              </span>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="peer w-full rounded-[14px] border-2 border-zinc-800 bg-zinc-950 px-[42px] py-[22px] pb-2 text-[14.5px] text-zinc-50 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_5px_rgba(45,212,191,0.14)]"
              />
              <label
                htmlFor="name"
                className="pointer-events-none absolute left-[42px] top-4 text-[14.5px] text-zinc-500 transition-all peer-focus:top-1.5 peer-focus:text-[10.5px] peer-focus:font-bold peer-focus:text-emerald-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10.5px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-emerald-500"
              >
                Ad Soyad
              </label>
            </div>

            <div className="relative mt-4">
              <span className="pointer-events-none absolute left-3.5 top-[19px] text-zinc-500">
                <AdminIcon name="mail" size={16} />
              </span>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full rounded-[14px] border-2 border-zinc-800 bg-zinc-950 px-[42px] py-[22px] pb-2 text-[14.5px] text-zinc-50 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_5px_rgba(45,212,191,0.14)]"
              />
              <label
                htmlFor="email"
                className="pointer-events-none absolute left-[42px] top-4 text-[14.5px] text-zinc-500 transition-all peer-focus:top-1.5 peer-focus:text-[10.5px] peer-focus:font-bold peer-focus:text-emerald-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10.5px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-emerald-500"
              >
                E-posta
              </label>
            </div>

            <div className="relative mt-4">
              <span className="pointer-events-none absolute left-3.5 top-[19px] text-zinc-500">
                <AdminIcon name="lock" size={16} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full rounded-[14px] border-2 border-zinc-800 bg-zinc-950 px-[42px] py-[22px] pb-2 text-[14.5px] text-zinc-50 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_5px_rgba(45,212,191,0.14)]"
              />
              <label
                htmlFor="password"
                className="pointer-events-none absolute left-[42px] top-4 text-[14.5px] text-zinc-500 transition-all peer-focus:top-1.5 peer-focus:text-[10.5px] peer-focus:font-bold peer-focus:text-emerald-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10.5px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-emerald-500"
              >
                Şifre (en az 6 karakter)
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                className="absolute right-3.5 top-[17px] p-1 text-zinc-500 hover:text-zinc-300"
              >
                <AdminIcon name={showPassword ? "eyeoff" : "eye"} size={17} />
              </button>
            </div>

            {error && (
              <p className="mt-3.5 rounded-xl bg-red-400/10 px-3 py-2.5 text-[13px] font-semibold text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-emerald-500 py-[13px] text-[14.5px] font-extrabold text-[#052e2b] shadow-[0_14px_28px_-12px_rgba(45,212,191,0.9)] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#052e2b]/35 border-t-[#052e2b]" />
              ) : (
                <>
                  Ücretsiz hesap oluştur
                  <AdminIcon name="arrow" size={16} />
                </>
              )}
            </button>

            <p className="mt-[22px] text-center text-[12.5px] text-zinc-500">
              Zaten hesabın var mı?{" "}
              <a href="/login" className="font-bold text-emerald-500 hover:underline">
                Giriş yap
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}