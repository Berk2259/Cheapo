import re

from adapters.json_ld import PriceResult

PRICE_PATTERN = re.compile(r'data-testid="discountedPrice"[^>]*>([\d.,]+)')


def parse_price(html: str) -> PriceResult:
    """Sayfa HTML'inde 'data-testid' ile işaretlenmiş fiyat kutusunu arar (örn. Şok Market)."""
    match = PRICE_PATTERN.search(html)
    if not match:
        raise ValueError("Sayfada fiyat kutusu (data-testid) bulunamadı")

    price = float(match.group(1).replace(".", "").replace(",", "."))
    return PriceResult(price=price, currency="TRY", in_stock=None)