import asyncio
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client
from notifier import send_notifications

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_due(product: dict) -> bool:
    """Ürünün kontrol zamanı geldi mi?"""
    if product.get("force_check_requested"):
        return True

    last = product["last_checked_at"]
    if last is None:
        return True
    elapsed = (datetime.now(timezone.utc) - datetime.fromisoformat(last)).total_seconds() / 60
    # 1 dakika tolerans: zamanlayıcı birkaç saniye erken çalışırsa tur atlanmasın
    return elapsed >= product["check_interval_minutes"] - 1

def read_price(product: dict):
    """Kaynağın yöntemine göre fiyatı okur."""
    source = product.get("sources")
    if isinstance(source, list):
        source = source[0] if source else None
    method = (source or {}).get("method", "json_ld")

    if method == "browser":
        from adapters.browser import fetch_price
    else:
        from adapters.json_ld import fetch_price
    return fetch_price(product["url"])

def check_product(product: dict):
    """Fiyat değiştiyse (product, eski, yeni) döndürür, yoksa None."""
    try:
        result = read_price(product)
    except Exception as e:
        (
            supabase.table("products")
            .update(
                {
                    "last_checked_at": now_iso(),
                    "last_status": f"hata: {e}"[:200],
                    "force_check_requested": False,
                }
            )
            .eq("id", product["id"])
            .execute()
        )
        print(f"[HATA] {product['name']}: {e}")
        return None

    supabase.table("price_history").insert(
        {
            "product_id": product["id"],
            "price": result.price,
            "currency": result.currency,
            "in_stock": result.in_stock,
        }
    ).execute()

    status_text = "ok" if not result.method else f"ok · {result.method}"

    (
        supabase.table("products")
        .update(
            {
                "current_price": result.price,
                "currency": result.currency,
                "last_checked_at": now_iso(),
                "last_status": status_text,
                "force_check_requested": False,
            }
        )
        .eq("id", product["id"])
        .execute()
    )

    print(f"[OK] {product['name']}: {product['current_price']} -> {result.price} {result.currency}")

    old_price = product["current_price"]
    # İlk okumada (eski fiyat yok) ya da fiyat aynıysa bildirim yok
    if old_price is None or float(old_price) == result.price:
        return None
    return (product, float(old_price), result.price)


def run_check_cycle() -> None:
    products = (
        supabase.table("products")
        .select(
                        "id, name, url, current_price, last_checked_at, check_interval_minutes, force_check_requested, sources(method)"
        )
        .eq("is_active", True)
        .is_("deleted_at", "null")
        .execute()
        .data
    )
    products = [p for p in products if is_due(p)]
    if not products:
        print("Kontrol edilecek ürün yok")
        return

    print(f"{len(products)} ürünün kontrol zamanı geldi")

    changes = []
    for product in products:
        change = check_product(product)
        if change:
            changes.append(change)

    if changes:
        print(f"{len(changes)} üründe fiyat değişti, bildirimler işleniyor")
        asyncio.run(send_notifications(changes))


if __name__ == "__main__":
    run_check_cycle()