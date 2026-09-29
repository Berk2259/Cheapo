"use client";

import { useState } from "react";
import { AdminIcon } from "@/components/admin-icons";

const guides = [
  {
    id: "g1",
    title: "İlk ürününü takibe al",
    summary: "Talep gönder → admin onaylar → Ürünlerim'de görünür.",
    steps: [
      "Sol menüden Talep gönder sayfasına git.",
      "Bir kategori ve takip etmek istediğin ürünleri seç.",
      "İstersen bir not ekleyip talebi gönder.",
      "Admin talebini onayladığında ürün otomatik olarak Ürünlerim'e eklenir ve fiyat takibi başlar.",
    ],
  },
  {
    id: "g2",
    title: "Telegram'ını bağla",
    summary: "Bildirim alabilmen için tek seferlik bağlantı gerekir.",
    steps: [
      "Sağ üstteki sarı \"Telegram bağlı değil\" uyarısına (ya da Hesap ayarları'ndaki Telegram kartına) tıkla.",
      "Açılan Telegram penceresinde botu Başlat (Start) butonuna bas.",
      "Bot \"hesabınız bağlandı\" mesajı gönderdiğinde işlem tamamdır.",
    ],
  },
  {
    id: "g3",
    title: "İlk sepetini oluştur",
    summary: "Sektör seç, ürün ekle, marketler arası fiyatı kıyasla.",
    steps: [
      "Sol menüden Alışveriş listesi'ne git (Premium'a özel).",
      "Yeni sepet'e tıkla, bir isim ver ve sektör seç.",
      "Ürün ekle ile o sektördeki takip ettiğin ürünlerden seç.",
      "Tablo ve alttaki kartlar, hangi marketin toplamda en ucuz olduğunu gösterir.",
    ],
  },
];

const faqs = [
  {
    q: "Bildirim neden gelmiyor?",
    a: "En sık sebep Telegram'ının bağlı olmaması. Sağ üstteki uyarıya tıklayıp bağlanabilirsin. Ayrıca bir ürüne hedef fiyat koymadıysan, sadece \"her değişimde bildir\" açıksa bildirim gelir.",
  },
  {
    q: "Hedef fiyat nasıl çalışır?",
    a: "Bir ürüne hedef fiyat koyarsan, fiyat o seviyeye inip altına düştüğünde Telegram'dan bildirim alırsın.",
  },
  {
    q: "Ücretsiz ve Premium farkı ne?",
    a: "Ücretsiz planda 1 kategori ve 3 ürün sınırı var. Premium'da sınır yok; Haftalık rapor, Ürün kıyası ve Alışveriş listesi gibi özellikler açılır. Detaylar için Planım sayfasına bakabilirsin.",
  },
  {
    q: "Hesabımı nasıl kapatırım?",
    a: "Hesap ayarları sayfasındaki \"Hesap kaldırma talebi gönder\" ile bir talep oluşturabilirsin; admin onayladıktan sonra hesabın kalıcı olarak silinir.",
  },
];

export function PortalHelp() {
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const guide = guides.find((g) => g.id === openGuide) ?? null;

  return (
    <div>
      <div className="ad-in">
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">Yardım & SSS</h1>
        <p className="mt-0.5 text-zinc-500">
          En sık yapılan işlemler için hızlı rehberler, altında kısa sorular.
        </p>
      </div>

      <div className="mt-5 grid gap-3.5 md:grid-cols-3">
        {guides.map((g, i) => {
          const open = openGuide === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setOpenGuide(open ? null : g.id)}
              className={
                "rounded-[20px] border p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-500 " +
                (open
                  ? "border-emerald-500 bg-emerald-500/[0.06]"
                  : "border-zinc-800 bg-zinc-900")
              }
            >
              <span className="mb-3 grid h-[26px] w-[26px] place-items-center rounded-lg bg-emerald-500/15 text-xs font-black text-emerald-300">
                {i + 1}
              </span>
              <b className="block text-[14.5px]">{g.title}</b>
              <span className="mt-1.5 block text-xs leading-relaxed text-zinc-500">
                {g.summary}
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-emerald-400">
                {open ? "Kapat" : "Adımları gör"}
                <AdminIcon name="arrow" size={12} stroke={2.6} />
              </span>
            </button>
          );
        })}
      </div>

      {guide && (
        <div className="mt-3.5 rounded-[20px] border border-emerald-500 bg-zinc-900 px-6 py-5">
          <h3 className="mb-3 text-base font-extrabold">{guide.title}</h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-zinc-400">
            {guide.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-7 overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900">
        {faqs.map((f, i) => {
          const open = openFaq === i;
          return (
            <div key={f.q} className={i > 0 ? "border-t border-zinc-800" : ""}>
              <button
                type="button"
                onClick={() => setOpenFaq(open ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-[13.5px] font-bold transition hover:text-emerald-300"
              >
                {f.q}
                <span className="text-zinc-500">{open ? "−" : "+"}</span>
              </button>
              {open && (
                <p className="px-5 pb-4 text-[12.5px] leading-relaxed text-zinc-500">
                  {f.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}