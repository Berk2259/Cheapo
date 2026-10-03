import os

from dotenv import load_dotenv
from supabase import create_client
from telegram import Bot

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
)


def format_price(value: float) -> str:
    """67.9 -> 67,90 (Türkçe gösterim)"""
    text = f"{value:,.2f}"
    return text.replace(",", "X").replace(".", ",").replace("X", ".")


def should_notify(sub: dict, old_price: float, new_price: float) -> bool:
    if sub["notify_on_any_change"]:
        return True
    target = sub["target_price"]
    if target is not None:
        target = float(target)
        # Fiyat hedefin üstündeydi, şimdi hedefe ya da altına indi
        return old_price > target >= new_price
    return False


def build_message(product: dict, old_price: float, new_price: float) -> str:
    change = (new_price - old_price) / old_price * 100
    direction = "düşüş" if change < 0 else "artış"
    return (
        "🔔 Fiyat değişti\n"
        f"{product['name']}\n"
        f"{format_price(old_price)} TL → {format_price(new_price)} TL "
        f"(%{abs(change):.1f} {direction})\n"
        f"{product['url']}"
    )


async def notify_one(bot: Bot, product: dict, old_price: float, new_price: float) -> None:
    subs = (
        supabase.table("subscriptions")
        .select(
            "target_price, notify_on_any_change, "
            "customers(id, name, telegram_chat_id, is_active, deleted_at)"
        )
        .eq("product_id", product["id"])
        .is_("deleted_at", "null")
        .execute()
        .data
    )

    message = build_message(product, old_price, new_price)

    for sub in subs:
        customer = sub["customers"]
        if not customer or customer["deleted_at"]:
            continue
        if not customer["is_active"] or not customer["telegram_chat_id"]:
            continue
        if not should_notify(sub, old_price, new_price):
            continue

        try:
            await bot.send_message(chat_id=customer["telegram_chat_id"], text=message)
            supabase.table("notification_log").insert(
                {
                    "customer_id": customer["id"],
                    "product_id": product["id"],
                    "message": message,
                }
            ).execute()
            print(f"  Bildirim gönderildi: {customer['name']}")
        except Exception as e:
            print(f"  [HATA] Bildirim gönderilemedi ({customer['name']}): {e}")


async def send_notifications(changes: list) -> None:
    """changes: [(product, old_price, new_price), ...]"""
    if not changes:
        return
    async with Bot(os.getenv("TELEGRAM_BOT_TOKEN")) as bot:
        for product, old_price, new_price in changes:
            await notify_one(bot, product, old_price, new_price)