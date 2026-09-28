import re

from adapters.json_ld import PriceResult

# Bazı siteler fiyatı JSON'a hiç koymadan, CSS class'ı "...Price" ile biten
# bir kutunun içine düz metin olarak yazıyor (örn. A101: "__normalPrice").
PRICE_PATTERN = re.compile(r'__normalPrice"[^>]*>\s*₺\s*([\d.,]+)')


def parse_price(html: str) -> PriceResult:
    """Sayfa HTML'inde class adı '__normalPrice' ile biten fiyat kutusunu arar."""
    match = PRICE_PATTERN.search(html)
    if not match:
        raise ValueError("Sayfada fiyat kutusu (normalPrice class'ı) bulunamadı")

    price = float(match.group(1).replace(".", "").replace(",", "."))
    return PriceResult(price=price, currency="TRY", in_stock=None)