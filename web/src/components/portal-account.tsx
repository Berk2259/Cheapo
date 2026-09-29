"use client";

import { useState, useTransition } from "react";
import { AdminIcon } from "@/components/admin-icons";
import { PortalTelegramCard } from "@/components/portal-telegram-card";
import {
  changePassword,
  disconnectTelegram,
  requestAccountRemoval,
  updateProfileName,
} from "@/app/portal/account/actions";

const cardClass =
  "rounded-[20px] border border-zinc-800 bg-zinc-900 p-[22px]";
const fieldClass =
  "w-full rounded-[10px] border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-50 outline-none transition focus:border-emerald-500 disabled:text-zinc-500 disabled:cursor-not-allowed";
const labelClass = "mb-1.5 block text-xs font-bold text-zinc-400";
const saveBtn =
  "mt-4 inline-flex items-center gap-1.5 rounded-[10px] bg-emerald-500 px-4 py-2 text-[13px] font-extrabold text-[#052e2b] transition hover:bg-emerald-400 disabled:opacity-50";

export function PortalAccount({
  name,
  email,
  bound,
  linkUrl,
  removalRequested,
}: {
  name: string;
  email: string;
  bound: boolean;
  linkUrl: string | null;
  removalRequested: boolean;
}) {
  const [profileName, setProfileName] = useState(name);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [tgMsg, setTgMsg] = useState<string | null>(null);
  const [removalDone, setRemovalDone] = useState(removalRequested);
  const [pending, startTransition] = useTransition();

  function saveProfile() {
    setProfileMsg(null);
    startTransition(async () => {
      const result = await updateProfileName(profileName);
      setProfileMsg(result.ok ? "Kaydedildi." : result.message ?? "Kaydedilemedi.");
    });
  }

  function savePassword() {
    setPwMsg(null);
    if (newPw !== newPw2) {
      setPwMsg("Yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }
    startTransition(async () => {
      const result = await changePassword(currentPw, newPw);
      if (result.ok) {
        setPwMsg("Şifre güncellendi.");
        setCurrentPw("");
        setNewPw("");
        setNewPw2("");
      } else {
        setPwMsg(result.message ?? "Güncellenemedi.");
      }
    });
  }

  function disconnect() {
    const ok = confirm("Telegram bağlantısını kesmek istediğine emin misin? Bildirimler durur.");
    if (!ok) return;
    setTgMsg(null);
    startTransition(async () => {
      const result = await disconnectTelegram();
      if (!result.ok) setTgMsg(result.message ?? "Kesilemedi.");
    });
  }

  function requestRemoval() {
    const ok = confirm(
      "Hesabını kaldırma talebi göndermek istediğine emin misin? Admin onayladıktan sonra hesabın kalıcı olarak silinir.",
    );
    if (!ok) return;
    startTransition(async () => {
      const result = await requestAccountRemoval();
      if (result.ok) setRemovalDone(true);
    });
  }

  return (
    <div>
      <div className="ad-in">
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">Hesap ayarları</h1>
        <p className="mt-0.5 text-zinc-500">
          Profil bilgilerini, şifreni ve bildirim bağlantını buradan yönetebilirsin.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Profil */}
        <div className={cardClass}>
          <div className="mb-1 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-emerald-500/15 text-emerald-300">
              <AdminIcon name="users" size={16} />
            </span>
            <b className="text-[15px]">Profil</b>
          </div>
          <p className="mb-4 text-[12.5px] text-zinc-500">
            İsmin panelde ve bildirimlerde bu şekilde görünür.
          </p>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Ad Soyad</label>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>E-posta</label>
              <input value={email} disabled className={fieldClass} />
            </div>
          </div>
          {profileMsg && <p className="mt-2 text-xs text-zinc-400">{profileMsg}</p>}
          <button type="button" onClick={saveProfile} disabled={pending} className={saveBtn}>
            <AdminIcon name="check" size={14} stroke={3} /> Kaydet
          </button>
        </div>

        {/* Şifre */}
        <div className={cardClass}>
          <div className="mb-1 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-emerald-500/15 text-emerald-300">
              <AdminIcon name="lock" size={16} />
            </span>
            <b className="text-[15px]">Şifre değiştir</b>
          </div>
          <p className="mb-4 text-[12.5px] text-zinc-500">
            Şifreni değiştirdikten sonra diğer cihazlarda yeniden giriş yapman gerekir.
          </p>
          <div className="mb-3.5">
            <label className={labelClass}>Mevcut şifre</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Yeni şifre</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Yeni şifre (tekrar)</label>
              <input
                type="password"
                value={newPw2}
                onChange={(e) => setNewPw2(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          {pwMsg && <p className="mt-2 text-xs text-zinc-400">{pwMsg}</p>}
          <button type="button" onClick={savePassword} disabled={pending} className={saveBtn}>
            <AdminIcon name="check" size={14} stroke={3} /> Şifreyi güncelle
          </button>
        </div>

        {/* Telegram */}
        <div className={cardClass}>
          <div className="mb-1 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-emerald-500/15 text-emerald-300">
              <AdminIcon name="send" size={16} />
            </span>
            <b className="text-[15px]">Telegram bağlantısı</b>
          </div>
          <p className="mb-4 text-[12.5px] text-zinc-500">
            Bildirimlerin gitmesi için hesabının bağlı olması gerekir.
          </p>
          <PortalTelegramCard bound={bound} linkUrl={linkUrl} />
          {bound && (
            <button
              type="button"
              onClick={disconnect}
              disabled={pending}
              className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] border border-zinc-800 px-3.5 py-2 text-[13px] font-bold text-zinc-300 transition hover:border-red-500 hover:text-red-400 disabled:opacity-50"
            >
              Bağlantıyı kes
            </button>
          )}
          {tgMsg && <p className="mt-2 text-xs text-red-400">{tgMsg}</p>}
        </div>

        {/* Tehlikeli bölge */}
        <div className="rounded-[20px] border border-red-900/50 bg-zinc-900 p-[22px]">
          <div className="mb-1 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-red-400/15 text-red-400">
              <AdminIcon name="alert" size={16} />
            </span>
            <b className="text-[15px]">Hesabı kaldır</b>
          </div>
          <p className="mb-4 text-[12.5px] text-zinc-500">
            Hesabını kapatmak istersen bir talep gönderebilirsin; admin onayladıktan sonra
            hesabın ve verilerin kalıcı olarak silinir. Bu işlem geri alınamaz.
          </p>
          {removalDone ? (
            <p className="inline-flex items-center gap-1.5 rounded-[10px] bg-amber-400/15 px-3.5 py-2 text-[13px] font-bold text-amber-300">
              <AdminIcon name="clock" size={14} /> Talebin gönderildi, admin incelemesi bekleniyor.
            </p>
          ) : (
            <button
              type="button"
              onClick={requestRemoval}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-red-500 px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-red-400 disabled:opacity-50"
            >
              <AdminIcon name="alert" size={14} /> Hesap kaldırma talebi gönder
            </button>
          )}
        </div>
      </div>
    </div>
  );
}