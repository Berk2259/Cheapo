import json
import re

from adapters.json_ld import PriceResult

# Next.js (Getir gibi) sitelerin sayfaya gömdüğü __NEXT_DATA__ script etiketi.
NEXT_DATA_PATTERN = re.compile(
    r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S
)


def _find_product(node):
    """__NEXT_DATA__ içinde fiyat + para birimi taşıyan ürün nesnesini bulur."""
    if isinstance(node, dict):
        currency = node.get("currency")
        if "price" in node and isinstance(currency, dict) and "codeAlpha" in currency:
            return node
        for value in node.values():
            found = _find_product(value)
            if found:
                return found
    elif isinstance(node, list):
        for item in node:
            found = _find_product(item)
            if found:
                return found
    return None


def parse_price(html: str) -> PriceResult:
    """Sayfa HTML'inden __NEXT_DATA__ içindeki fiyat bilgisini çıkarır."""
    match = NEXT_DATA_PATTERN.search(html)
    if not match:
        raise ValueError("Sayfada __NEXT_DATA__ bulunamadı")

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        raise ValueError("__NEXT_DATA__ ayrıştırılamadı")

    product = _find_product(data)
    if not product:
        raise ValueError("__NEXT_DATA__ içinde fiyat bilgisi bulunamadı")

    status = product.get("status")
    return PriceResult(
        price=float(product["price"]),
        currency=product["currency"].get("codeAlpha", "TRY"),
        in_stock=(status == 1) if status is not None else None,
    )