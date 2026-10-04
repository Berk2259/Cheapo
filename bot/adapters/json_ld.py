import json
import re
from dataclasses import dataclass

import httpx

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9",
}

LD_JSON_PATTERN = re.compile(
    r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', re.S
)


@dataclass
class PriceResult:
    price: float
    currency: str
    in_stock: bool | None
    method: str | None = None


def _find_product_offers(node):
    """JSON içinde '@type': 'Product' olan ilk nesnenin kendi 'offers' alanını bulur.

    Sayfadaki herhangi bir Offer'ı değil, ürünün KENDİ offers'ını almak için;
    yoksa "benzer ürünler" gibi alakasız bölümlerdeki fiyatlar yanlışlıkla seçilebilir.
    """
    if isinstance(node, dict):
        type_ = node.get("@type")
        types = type_ if isinstance(type_, list) else [type_]
        if "Product" in types and "offers" in node:
            return node["offers"]
        for value in node.values():
            found = _find_product_offers(value)
            if found:
                return found
    elif isinstance(node, list):
        for item in node:
            found = _find_product_offers(item)
            if found:
                return found
    return None


def _pick_offer(offers):
    """offers tek bir Offer, bir liste ya da AggregateOffer olabilir; satılan fiyatı taşıyanı seçer."""
    candidates = offers if isinstance(offers, list) else [offers]
    for offer in candidates:
        if not isinstance(offer, dict):
            continue
        if "price" in offer:
            return offer
        if "lowPrice" in offer:
            offer = dict(offer)
            offer["price"] = offer["lowPrice"]
            return offer
    return None


def parse_price(html: str) -> PriceResult:
    """Sayfa HTML'inden JSON-LD fiyat bilgisini çıkarır."""
    for match in LD_JSON_PATTERN.finditer(html):
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue

        offers = _find_product_offers(data)
        if not offers:
            continue
        offer = _pick_offer(offers)
        if offer:
            availability = str(offer.get("availability", ""))
            return PriceResult(
                price=float(offer["price"]),
                currency=offer.get("priceCurrency", "TRY"),
                in_stock="InStock" in availability if availability else None,
            )

    raise ValueError("Sayfada fiyat bilgisi (JSON-LD) bulunamadı")


def fetch_price(url: str) -> PriceResult:
    response = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=20)
    response.raise_for_status()
    return parse_price(response.text)