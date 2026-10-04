import re

from adapters.json_ld import PriceResult

# Bazı siteler fiyatı JSON'a hiç koymadan, CSS class'ı "...Price" ile biten
# bir kutunun içine düz metin olarak yazıyor (örn. A101: "__normalPrice" ya da
# indirimli üründe "__discountedPrice"). İkisi de varsa indirimli (gerçek
# ödenen) fiyat tercih edilir.
DISCOUNTED_PATTERN = re.compile(r'__discountedPrice"[^>]*>\s*₺\s*([\d.,]+)')
NORMAL_PATTERN = re.compile(r'__normalPrice"[^>]*>\s*₺\s*([\d.,]+)')


def parse_price(html: str) -> PriceResult:
    """Sayfa HTML'inde class adı '...Price' ile biten fiyat kutusunu arar."""
    match = DISCOUNTED_PATTERN.search(html) or NORMAL_PATTERN.search(html)
    if not match:
        raise ValueError("Sayfada fiyat kutusu (normalPrice/discountedPrice class'ı) bulunamadı")

    price = float(match.group(1).replace(".", "").replace(",", "."))
    return PriceResult(price=price, currency="TRY", in_stock=None)