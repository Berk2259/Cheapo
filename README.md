# Price Tracker Bot

Admin panelden yönetilen, çok müşterili ve kategorili fiyat takip sistemi.
Fiyat değişimlerinde müşterilere Telegram bildirimi gider.

## Klasör yapısı

```
Price_Tracker_Bot/
├── bot/
│   ├── main.py        Telegram botu (müşteri bağlama)
│   ├── checker.py     Fiyat kontrolcüsü (fiyatı okur ve kaydeder)
│   ├── notifier.py    Fiyat değişiminde Telegram bildirimi
│   ├── adapters/      Fiyat okuyucular (json_ld.py: düz HTTP, browser.py: gerçek tarayıcı)
│   ├── requirements.txt
│   └── .env           Gizli anahtarlar (GitHub'a gitmez)
├── web/
│   ├── src/app/admin/     Admin sayfaları (giriş, talepler, müşteri talepleri, müşteriler, kategoriler, kaynaklar, ürünler, takipler, fiyat geçmişi, bildirimler)
│   ├── src/app/login/     Tek giriş sayfası (admin ve müşteri için)
│   ├── src/app/portal/    Müşteri portalı (ürünlerim, bildirimler, talepler, plan, rapor, kıyas)
│   ├── src/app/page.tsx   Herkese açık tanıtım sayfası (landing page)
│   ├── src/lib/supabase/  Supabase bağlantıları (tarayıcı ve sunucu)
│   ├── src/proxy.ts       Giriş koruması
│   ├── src/components/    Ortak bileşenler (yan menü, butonlar, talep formu)
│   ├── src/components/landing/  Landing page bölümleri (hero, 3 adımda hazır, kategoriler, SSS, planlar, talep)
│   └── .env.local         Panel ayarları (GitHub'a gitmez)
└── supabase/          Veritabanı şema dosyaları (SQL)
```

## Teknolojiler

| Parça | Seçim |
|---|---|
| Veritabanı ve giriş | Supabase |
| Admin panel | Next.js |
| Bot | Python 3.14 |
| Fiyat okuma | httpx (düz HTTP), Playwright (gerçek tarayıcı) |
| Bildirim | Telegram Bot API |


## Sistem nasıl çalışır

```
Admin panel ──► Supabase ◄── Bot ──► Telegram
 (yönetim)     (veritabanı)  (fiyat    (müşteriye
                              çeker)   bildirim)
```

1. Admin, panelden müşteri, kategori ve takip edilecek ürünleri tanımlar.
2. Bot, Supabase'den aktif ürünleri okur ve her ürünün fiyatını kaynağından çeker.
3. Fiyat geçmişe kaydedilir. Fiyat değiştiyse ürünü takip eden müşterilere
   Telegram'dan bildirim gider.

Bir ürünün fiyatı müşteri başına değil, ürün başına **bir kez** çekilir.
Aynı ürünü birden çok müşteri takip etse de kaynağa tek istek gider.

Her ürünün kendi kontrol aralığı vardır (`check_interval_minutes`). Kontrolcü
ne kadar sık çalıştırılırsa çalıştırılsın, yalnızca aralığı dolan ürünlere
bakar.

Kontrol aralığı en az 5 dakikadır. Bir ürünün linki değiştirilirse eski fiyat
sıfırlanır, böylece bot yeni sayfadaki fiyatı eski ürünle kıyaslayıp yanlış
bildirim göndermez.

Admin panel `/admin` altındadır (`/admin/login` hariç, girişsiz erişilemez). Kök
adres (`/`) herkese açık tanıtım sayfasıdır (landing page).

### Bildirim kuralları

Bir ürünün fiyatı bir önceki kontrole göre değiştiğinde, ürünü takip eden
her müşteri için şu kurallara bakılır:

- **Her değişimde bildir** seçiliyse: her fiyat değişiminde bildirim gider.
- **Hedef fiyat** girilmişse: fiyat hedefin üstündeyken hedefe ya da altına
  inerse bildirim gider. Fiyat hedefin altında kaldığı sürece tekrar
  bildirim gitmez.

Ürünün ilk kez okunduğunda (önceki fiyat yokken) bildirim gitmez. Gönderilen
her bildirim `notification_log` tablosuna kaydedilir.

### Müşteri bağlama

Her müşterinin panelde otomatik üretilen bir bağlama kodu vardır. Panelden
müşteri için bağlama linki kopyalanıp müşteriye gönderilir. Müşteri linke
tıklayıp Start'a bastığında (bot `/start KOD` komutunu alır) bot Telegram
chat ID'sini o müşteriye kaydeder.

### Panel erişimi

Panele yalnızca tek bir admin hesabı girebilir. Giriş Supabase Auth ile
yapılır. Veritabanında her tabloda satır bazlı güvenlik (RLS) açıktır ve
kurallar `is_admin()` fonksiyonuna bağlıdır; bu fonksiyon yalnızca admin
hesabının kimliğini (UID) kabul eder. Başka bir hesap açılsa bile hiçbir veri
görülemez. Bot ise `service_role` ile çalışır ve bu kuralları atlar.

Giriş tek bir sayfadan (`/login`) yapılır. Giriş başarılı olunca sistem bu
hesabın `customers` tablosunda bir kaydı olup olmadığına bakar: varsa
müşteri portalına (`/portal`), yoksa admin panele (`/admin`) yönlendirir.
Her istekte bu kontrol tekrar yapılır, yani bir müşteri adres çubuğuna elle
`/admin` yazsa da otomatik olarak `/portal`'a geri gönderilir (ve tersi).

Giriş sayfası koyu temalı, ortada bölünmüş kartlı bir tasarıma sahiptir
(`components/login-showcase.tsx`, `components/login-showcase-data.ts`).
Arka planda örnek ürün/fiyat kartları çapraz şeritler halinde sürekli akar
(saf CSS animasyonu, `globals.css` içindeki `lg-` ön ekli kurallar); bu
kartlardaki ürün/fiyat bilgileri sayfa herkese açık olduğu için tamamen
kurgusal örnek verilerdir, gerçek müşteri verisi değildir. Sağdaki form
e-posta/şifre alanları, şifre göster-gizle, "Beni hatırla" (şu an yalnızca
görsel, kalıcı bir davranışı yok) ve "Şifremi unuttum" (henüz pasif, ileride
eklenecek) içerir.

### Talep ve hesap açma akışı

Ziyaretçi landing page'deki formu doldurup talep gönderir (`leads` tablosu).
Admin, Talepler sayfasından talebi inceler ve uygun bulursa e-posta/şifre
belirleyip hesap açar. Bu işlem Supabase Auth'ta yeni bir kullanıcı, ardından
`customers` tablosunda o kullanıcıya bağlı bir müşteri kaydı oluşturur ve
talebi otomatik "Tamamlandı" yapar.

### Müşteri portalı

Hesabı açılan müşteri `/login`'den giriş yapıp `/portal`'a yönlenir. Portal
koyu temalıdır, masaüstünde yan menü, telefonda alt sekmelerle çalışır
(`components/portal-shell.tsx`). Sayfalar:

- **Ürünlerim**: özet kutuları, hedefinin altına inen ürün için fırsat bandı,
  ürün kartları (fiyat grafiği, en düşük/en yüksek fiyat, değişim yüzdesi,
  hedefe yakınlık), arama, sıralama ve kart/liste görünümü. Sağ kolonda plan
  kartı, Telegram durumu ve son 3 bildirim.
- **Bildirimlerim**: Telegram'dan gelen bildirimlerin günlere göre kaydı.
- **Talep gönder**: kategori ve ürün seçerek talep. Plan sınırı seçim sırasında
  önizlenir ve aşılırsa gönderilmeden uyarılır. Taleplerin durumu adım adım
  izlenir (Gönderildi, İnceleniyor, Takibe eklendi).
- **Planım**: Ücretsiz ve Premium planın karşılaştırması.
- **Alışveriş listesi** (yalnızca Premium): market ürünlerinden sepet oluşturma
  ve satıcı bazında toplam kıyaslama.
- **Haftalık rapor** ve **Ürün kıyası** (yalnızca Premium): Ücretsiz müşteri
  kilitli önizleme görür.

Haftalık rapor, `price_daily` görünümündeki günlük son fiyatlardan ve bildirim
kayıtlarından hesaplanır (son 7 ya da 30 gün). Ürün kıyası, aynı ürünün farklı
satıcılardaki fiyatını yan yana gösterir: yönetici, aynı ürünün her satıcıdaki
kaydını admin panelinde ürün düzenlerken aynı **karşılaştırma grubuna**
(`products.comparison_group`, örn. `coca-cola-1-5l`) koyar. Müşteri bir ürünü
takip ettiğinde, o ürünün grubundaki tüm marketler kıyas sayfasında görünür.
"Destekle yaz" ve "Premium için yaz" düğmeleri şimdilik yalnızca görünümdür.

Alışveriş listesi, müşterinin **kendi seçtiği** Market kategorisi ürünlerinden
oluşur (`basket_items` tablosu, `customer_id` + `product_id`); "Ürün ekle"
panelinden eklenmeyen hiçbir ürün listede görünmez. Eklenen ürün bir
karşılaştırma grubuna bağlıysa, o gruptaki diğer satıcıların fiyatları da
otomatik olarak aynı satırda gösterilir ve satıcı bazında toplam hesaplanıp en
ucuz satıcı vurgulanır; tek satıcıdan takip edilen ürünler de eklenebilir,
sadece kıyaslama çıkmaz.

Portalın veritabanı erişimi satır bazlı güvenlik (RLS) kurallarıyla sağlanır:
müşteri sadece kendi `customers`, `subscriptions`, `customer_requests`,
`notification_log` ve takip ettiği ürünlerin `price_history` satırlarını
okuyabilir; ayrıca aktif ürünleri ve aktif kaynakları okuyabilir. Hiçbir tabloya
yazma yetkisi yoktur (talep göndermek sunucu işleminden geçer).

### Müşteri talebi ve otomatik takip

Müşteri portaldan bir kategori ve o kategorideki ürünleri seçip talep
gönderir (`customer_requests` + `customer_request_products`). Admin, panelin
**Müşteri talepleri** sayfasından bu talepleri görür ve durumunu değiştirir
(Bekliyor / İnceleniyor / Tamamlandı / Reddedildi). Durum **Tamamlandı**
yapıldığında seçilen ürünler otomatik olarak müşterinin takiplerine
(`subscriptions`) eklenir; hedef fiyat ve bildirim kuralı boş kalır, admin
bunu Takipler sayfasından ayarlar.

### Plan sınırları

Ücretsiz planda en fazla 1 kategori ve 3 ürün takip edilebilir (premium'da
sınır yok). Bu sınır, müşteri portaldan yeni talep gönderirken kontrol edilir;
sınır aşılıyorsa talep reddedilir ve mevcut kullanım anlaşılır bir mesajla
gösterilir. Sınırlar `web/src/lib/plan-limits.ts` dosyasında tanımlıdır.
Admin, Takipler sayfasından bu sınırın üstünde elle ekleme yapabilir.

### Şimdi kontrol et

Admin, Ürünler sayfasından bir ürüne "Şimdi kontrol et" diyebilir. Bu, ürünün
`force_check_requested` bayrağını işaretler. Bot en fazla 1 dakika içinde bu
bayrağı görüp ürünü hemen kontrol eder ve bayrağı sıfırlar; ürünün kendi
kontrol aralığını beklemesine gerek kalmaz.

### Landing page tasarımı

Kök sayfa (`/`) bölümlere ayrılmıştır ve her bölüm `web/src/components/landing/`
altında ayrı bir dosyadır: hero (cihaz sahnesi ve kayan ürün duvarı), 3 adımda
hazır, kategoriler, Merak edilenler (bot sohbeti şeklinde), planlar ve talep
formu. Talep formu `web/src/components/lead-form.tsx` dosyasındadır ve
`leads` tablosuna kaydeder.

Renkler `globals.css` içindeki `@theme` bloğunda tanımlıdır. Animasyonlar
saf CSS ile yazılmıştır ve bölüme göre önek alır: `hv-` (hero), `hiw-` (3 adımda
hazır), `pl-` (planlar), `pf-` (SSS sohbeti), `lf-` (talep formu). Kaydırınca
başlayan animasyonlar küçük bir `IntersectionObserver` ile tetiklenir, ayarlarda
"hareketi azalt" seçiliyse tüm animasyonlar kapanır (`prefers-reduced-motion`).

Hero'daki cihaz ekranlarında görünen ürünler ve fiyatlar örnek veridir, gerçek
takip verisi değildir.

### Admin paneli tasarımı

Admin paneli koyu temalıdır ve müşteri portalından ayrıdır. `web/src/app/admin/layout.tsx`
içindeki `force-dark` sınıfı, `globals.css`'teki özel `dark` varyantı sayesinde
admin içindeki tüm `dark:` sınıflarını işletim sistemi temasından bağımsız açar;
giriş sayfası ve portal etkilenmez. Renkler yine `globals.css`'te, `.force-dark`
içinde gri ve yeşil paletin yeniden tanımlanmasıyla (koyu turkuaz) verilir.

- **Yan menü** (`sidebar.tsx`): Gelenler, Katalog, Takip gruplarına ayrılmıştır.
  Talepler ve Müşteri talepleri yanında durumu "bekliyor" olan kayıtların sayısı
  kırmızı rozet olarak görünür (sayılar `admin/layout.tsx`'te hesaplanır).
- **Üst çubuk ve arama** (`admin-topbar.tsx`, `admin-nav.ts`): sayfa başlığı ve
  Ctrl+K ile açılan sayfa arama penceresi.
- **Ana sayfa**: "Dikkat gerektirenler" (okunamayan ürünler, bekleyen talepler,
  Telegram'a bağlanmamış müşteriler), istatistik kartları, son bildirimler ve
  ürün durumu. Hepsi Supabase'den gerçek veriyle gelir.
- **Ürünler**: arama, durum filtreleri (Hatalı, Sırada, Pasif), durum rozetleri
  ve tek tıkla "şimdi kontrol et". Ürün ekleme ve düzenleme sağdan açılan
  çekmecede yapılır (`product-drawer.tsx`); aynı çekmecede ürünün karşılaştırma
  grubu da girilir.
- **Talepler ve Müşteri talepleri**: gelen kutusu düzeni; durum filtreleri,
  arama ve renkli durum seçicisi. Talepler sayfasında "Hesap aç" kartın içinde
  açılır.
- **Bildirimler**: günlere göre gruplanmış akış, mesajlar Telegram balonu
  şeklinde, müşteri seçici ve arama.
- **Fiyat geçmişi**: her kaydın bir önceki kayda göre değişimi, ürün seçilince
  fiyat grafiği (güncel, en düşük, en yüksek, toplam değişim).
- **Kategoriler ve Kaynaklar**: kart görünümü; her kartta bağlı ürün (ve
  kategoride müşteri) sayısı. Bağlı ürünü olan kategori ya da kaynak silinemez.
- **Takipler**: müşteriye göre gruplu kartlar; her müşteride Telegram durumu
  (bağlı değilse bildirim gidemediği belirtilir), ürünün güncel fiyatı ve
  hedefe uzaklığı. Ekleme ve düzenleme sağdan açılan çekmecede yapılır.
- **Müşteriler**: kart görünümü; plan (Ücretsiz/Premium) düzenleme çekmecesinden
  değiştirilebilir, bağlı olmayan müşterinin bağlama linki karttan kopyalanır.
  Kartta kategoriler, takip sayısı ve müşterinin bildirimlerine kısayol vardır.

Tüm admin sayfaları yenilenmiştir.

## Kurulum

### Ön koşullar

- Python 3.10 veya üstü
- Git
- Bir Supabase projesi
- BotFather'dan alınmış bir Telegram bot tokenı

### Bot

1. `bot/.env` dosyasını oluştur (GitHub'a gitmez):

```
TELEGRAM_BOT_TOKEN=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Service role anahtarı çok güçlüdür: sadece botta kullanılır, panele ve
GitHub'a asla konmaz.

2. Sanal ortamı kur ve kütüphaneleri yükle:

```powershell
cd bot
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Botlara engel koyan siteleri (örn. CarrefourSA, Cloudflare kullanır) okumak için
gerçek bir tarayıcı gerekir. Bunun için Playwright'ı ve Chromium'u bir kez kur:

```powershell
pip install playwright
playwright install chromium
```

Bu yalnızca kaynağın yöntemi **Tarayıcı (Playwright)** olan ürünler için
kullanılır; diğer ürünler eskisi gibi düz HTTP ile okunur.

3. Botu çalıştır:

```powershell
python main.py
```

`python main.py` çalıştığı sürece bot hem Telegram'ı dinler hem arka planda her dakika hangi ürünlerin kontrol zamanı geldiğine bakar, ayrı bir komut gerekmez. `python checker.py`'yi elle bir kez çalıştırmak (tek seferlik test için) hâlâ mümkündür.

Yeni bir terminal açıldığında önce sanal ortam tekrar etkinleştirilir
(`.venv\Scripts\Activate.ps1`).

### Panel

1. `web/.env.local` dosyasını oluştur (GitHub'a gitmez):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
TELEGRAM_BOT_USERNAME=
SUPABASE_SERVICE_ROLE_KEY=
```
`TELEGRAM_BOT_USERNAME`, müşteri bağlama linkini oluşturmak için botun
kullanıcı adıdır (başında `@` olmadan).

Panelde yalnızca `sb_publishable_` ile başlayan anahtar kullanılır.
Service role anahtarı panele asla konmaz.

`SUPABASE_SERVICE_ROLE_KEY` sadece hesap açma işleminde, sunucu tarafında
(`"use server"` dosyasında) kullanılır ve tarayıcıya asla gönderilmez.
`NEXT_PUBLIC_` öneki almadığından client koduna erişilemez.

2. Paketleri kur ve çalıştır:

```powershell
cd web
npm install
npm run dev
```

Panel `http://localhost:3000` adresinde açılır.

3. Supabase'de Authentication → Users bölümünden admin hesabını oluştur.

## Veritabanı tabloları

| Tablo | Amaç |
|---|---|
| `categories` | Market, E-ticaret, Uçak bileti vb. |
| `customers` | Müşteriler, Telegram chat ID, bağlama kodu |
| `customer_categories` | Müşteri - kategori eşleşmesi |
| `sources` | Fiyat kaynağı ve çekme yöntemi (api, json_ld, http, browser) |
| `products` | Takip edilen ürünler (ürün başına tek kayıt) |
| `subscriptions` | Müşteri - ürün takibi, hedef fiyat |
| `price_history` | Fiyat geçmişi |
| `notification_log` | Gönderilen bildirim kayıtları |

Ek olarak:

- `products.comparison_group`: aynı grup adını taşıyan ürünler aynı ürünün farklı
  farklı satıcılardaki kayıtlarıdır (Ürün kıyası bu alanı kullanır).
- `price_daily` (görünüm): `price_history`'nin günlük son fiyat özeti (Türkiye
  saatine göre). `security_invoker` ile çalışır, yani sorgulayan kullanıcının
  RLS izinleri geçerlidir.

## Fiyat çekme yaklaşımı

Her kaynak için ayrı "adapter" yazılır. Yöntem önceliği:
1. Resmi API
2. Sayfadaki JSON-LD verisi
3. Sitenin iç JSON endpoint'i
4. Playwright (gerçek tarayıcı)
5. Ücretli scraping servisi (son çare)

Hangi ürünün hangi yöntemle okunacağı, ürünün **kaynağının** yöntemine göre
belirlenir (`sources.method`, panelde Kaynaklar sayfası). Şu an iki yöntem
çalışır durumdadır:

- **JSON-LD (sayfa verisi)**: düz HTTP isteği ile sayfadaki JSON-LD fiyat verisi
  okunur (örn. Migros). Hızlıdır.
- **Tarayıcı (Playwright)**: headless Chromium ile sayfa açılır ve aynı JSON-LD
  verisi okunur (örn. CarrefourSA). Cloudflare gibi bot korumasını geçmek için
  varsayılan "HeadlessChrome" kimliği yerine normal bir Chrome kimliği
  kullanılır. Her sayfa birkaç saniye sürer. Kontrolcü tarayıcıyı yalnızca bu
  yöntemdeki ürünler için başlatır.

Yeni bir market eklerken önce düz HTTP ile (JSON-LD) denenmelidir; site 403
veriyorsa kaynağın yöntemi "Tarayıcı (Playwright)" yapılır. Sunucunun IP adresi
Cloudflare tarafından farklı değerlendirilebileceği için, canlıya alırken
tarayıcı yöntemi orada da denenmelidir.

## Yapılanlar

- [x] Supabase projesi ve veritabanı şeması (8 tablo)
- [x] Telegram botu oluşturuldu
- [x] Müşteri bağlama akışı (`/start KOD` ile chat ID kaydı)
- [x] Bot -> müşteri Telegram bildirimi doğrulandı
- [x] Fiyat okuyucu (JSON-LD): sayfadan fiyat ve stok bilgisi çekiyor
- [x] Kontrolcü: aktif ürünlerin fiyatını okuyup geçmişe kaydediyor
- [x] Fiyat değişiminde Telegram bildirimi (her değişimde ve hedef fiyata düşünce)
- [x] Ürün bazlı kontrol aralığı (sırası gelmeyen ürün atlanıyor)
- [x] Panel iskeleti: admin girişi/çıkışı ve giriş koruması
- [x] Panel: yan menülü düzen ve özet kartlarıyla ana sayfa
- [x] Panel: müşteri yönetimi (ekleme, satır içi düzenleme, silme, Telegram bağlama linki)
- [x] Panel: kategori yönetimi (ekleme, satır içi düzenleme, silme)
- [x] Panel: kaynak yönetimi (ekleme, satır içi düzenleme, silme)
- [x] Panel: ürün yönetimi (ekleme, satır içi düzenleme, silme, kategori ve kaynak seçimi)
- [x] Panel: takip yönetimi (müşteri-ürün eşleştirme, hedef fiyat ve bildirim kuralı)
- [x] Panel: fiyat geçmişi (listeleme, ürüne göre filtreleme, kayıt silme)
- [x] Panel: bildirim kayıtları (listeleme, müşteriye göre filtreleme, kayıt silme)
- [x] Panel: müşteriye kategori atama (Market, E-ticaret, Uçak bileti vb.)
- [x] Panel: admin sayfaları `/admin` altına taşındı, kök adres genel kullanım için ayrıldı
- [x] Veritabanı: müşteri hesabı bağlantısı (`auth_user_id`), plan alanı, `leads` ve `customer_requests` tabloları
- [x] Landing page: tanıtım, plan karşılaştırması ve talep formu (leads tablosuna kaydediyor)
- [x] Panel: Talepler sayfası (leads listeleme, durum değiştirme, silme)
- [x] Panel: talepten müşteri hesabı açma (Supabase Auth + customers kaydı)
- [x] Tek giriş sayfası (/login), hesap türüne göre /admin veya /portal'a yönlendirme(koyu temalı, çapraz akan ürün kartlı arka plan tasarımıyla yenilendi)
- [x] Müşteri portalı: giriş, takip edilen ürünler ve fiyatları görme
- [x] Müşteri portalı: yeni talep gönderme (kategori + ürün seçimi) ve kendi taleplerini görme
- [x] Panel: Müşteri talepleri sayfası, Tamamlandı'da otomatik takip ekleme
- [x] Ücretsiz plan sınırı (1 kategori, 3 ürün), müşteri talep gönderirken kontrol ediliyor
- [x] Bot: Telegram hesabı başka müşteriye bağlıysa anlaşılır hata mesajı (çökmüyor)
- [x] Bot sürekli çalışır: Telegram dinleme ve fiyat kontrolü tek süreçte (60 saniyede bir kontrol turu)
- [x] Panel: "Şimdi kontrol et" düğmesi, bot en fazla 1 dakika içinde işliyor
- [x] Landing page yenilendi: animasyonlu hero, 3 adımda hazır, kategoriler, planlar, SSS sohbeti ve talep formu
- [x] Admin paneli yenilendi (1. aşama): koyu tema, gruplu menü ve rozetler, Ctrl+K arama, yeni ana sayfa, Ürünler sayfası ve düzenleme çekmecesi
- [x] Admin paneli yenilendi (2. aşama): Talepler, Müşteri talepleri, Bildirimler, Fiyat geçmişi (grafikli), Kategoriler ve Kaynaklar sayfaları
- [x] Admin paneli yenilendi (3. aşama): Takipler ve Müşteriler sayfaları, panelden müşteri planı değiştirme
- [x] Müşteri portalı yenilendi: koyu tema, yan menü, geniş ürün sayfası, bildirimler, gelişmiş talep formu, Planım
- [x] Premium: Haftalık ve aylık rapor ile Satıcılar arası ürün kıyası (aynı ürünün market kayıtları admin panelinde "Karşılaştırma grubu" ile bağlanır)
- [x] Premium: Alışveriş listesi (Market ürünlerinden sepet oluşturma, satıcı bazında toplam kıyaslama)
- [x] Bot: gerçek tarayıcı (Playwright) ile okuma, Cloudflare korumalı siteler için (CarrefourSA); kaynağın yöntemine göre okuyucu seçimi
- [x] Panel: ürünlere karşılaştırma grubu alanı