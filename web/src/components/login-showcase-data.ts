// Giriş ekranının arka planındaki kartlar için sabit, kurgu veri.
// Herkese açık bir sayfa olduğu için gerçek müşteri/ürün/mağaza verisi kullanılmaz.
export type ShowcaseCard = {
  name: string;
  category: string;
  price: string;
  change: string;
  tone: "dn" | "up" | "eq";
  source: string;
  avatar: string;
};

export const SHOWCASE_CARDS: ShowcaseCard[] = [
  { name: "Coca-Cola Orijinal Tat Pet 1,5 L", category: "Market", price: "67,00 TRY", change: "↓ %16,3", tone: "dn", source: "Kolay Market", avatar: "K" },
  { name: "Kulaklık X200", category: "Elektronik", price: "1.115,00 TRY", change: "↓ %10,7", tone: "dn", source: "Teknodepo", avatar: "T" },
  { name: "Dido Sütlü Çikolatalı Gofret", category: "Market", price: "27,50 TRY", change: "↓ %26,7", tone: "dn", source: "Mavi Market", avatar: "M" },
  { name: "İstanbul – Ankara bileti", category: "Uçak bileti", price: "980,00 TRY", change: "↓ %10,1", tone: "dn", source: "BiletYolu", avatar: "B" },
  { name: "Çamlıca Portakal Gazoz 1 L", category: "Market", price: "50,00 TRY", change: "↑ %25,3", tone: "up", source: "Mavi Market", avatar: "M" },
  { name: "Mekanik Klavye", category: "Elektronik", price: "2.299,00 TRY", change: "değişmedi", tone: "eq", source: "Dijital Nokta", avatar: "D" },
  { name: "Kadın Yağmurluk", category: "Giyim", price: "649,90 TRY", change: "↓ %10,9", tone: "dn", source: "ModaNokta", avatar: "M" },
  { name: "Şampuan 500 ml", category: "Kozmetik", price: "89,90 TRY", change: "değişmedi", tone: "eq", source: "Güzellik Noktası", avatar: "G" },
  { name: "Akıllı Saat S7", category: "Elektronik", price: "3.499,00 TRY", change: "↓ %8,4", tone: "dn", source: "Alışveriş Durağı", avatar: "A" },
  { name: "Bebek Bezi 4 Numara", category: "Market", price: "249,90 TRY", change: "↑ %6,1", tone: "up", source: "Aile Market", avatar: "A" },
  { name: "Kahve Makinesi", category: "Elektronik", price: "1.899,00 TRY", change: "↓ %14,2", tone: "dn", source: "Teknodepo", avatar: "T" },
  { name: "İzmir – İstanbul otobüsü", category: "Otobüs", price: "420,00 TRY", change: "↓ %5,0", tone: "dn", source: "YolArkadaşı", avatar: "Y" },
];