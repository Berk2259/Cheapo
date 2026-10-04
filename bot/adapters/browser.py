from playwright.sync_api import sync_playwright

from adapters.json_ld import PriceResult, parse_price as parse_json_ld
from adapters.next_data import parse_price as parse_next_data
from adapters.data_testid import parse_price as parse_data_testid
from adapters.price_class import parse_price as parse_price_class

# Botlara engel koyan siteler (Cloudflare gibi) için gerçek tarayıcıyla okur.
# "HeadlessChrome" yerine normal bir Chrome kimliği kullanılır.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def fetch_price(url: str) -> PriceResult:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        try:
            context = browser.new_context(locale="tr-TR", user_agent=USER_AGENT)
            page = context.new_page()
            response = page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(3000)

            status = response.status if response else 0
            if status >= 400:
                raise RuntimeError(f"Sayfa açılamadı (HTTP {status})")

            html = page.content()
        finally:
            browser.close()

    # Sırayla dener: class adı "...Price" ile biten fiyat kutusu ->
    # data-testid fiyat kutusu -> Next.js __NEXT_DATA__ -> JSON-LD. Önce
    # sayfada GERÇEKTEN görünen fiyat denenir; JSON-LD bazı sitelerde (örn.
    # A101) yanlış/başka kanal fiyatı içerebildiği için en sona alındı.
    try:
        result = parse_price_class(html)
        result.method = "price_class"
        return result
    except ValueError:
        pass
    try:
        result = parse_data_testid(html)
        result.method = "data_testid"
        return result
    except ValueError:
        pass
    try:
        result = parse_next_data(html)
        result.method = "next_data"
        return result
    except ValueError:
        pass
    result = parse_json_ld(html)
    result.method = "json_ld"
    return result