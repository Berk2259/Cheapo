import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from postgrest.exceptions import APIError

from checker import run_check_cycle

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "Merhaba! Bağlanmak için size gönderilen özel linki kullanın."
        )
        return

    token = context.args[0]
    chat_id = update.effective_chat.id

    result = (
        supabase.table("customers")
        .select("id, name")
        .eq("link_token", token)
        .is_("deleted_at", "null")
        .execute()
    )
    if not result.data:
        await update.message.reply_text("Geçersiz bağlantı kodu.")
        return

    customer = result.data[0]
    try:
        (
            supabase.table("customers")
            .update({"telegram_chat_id": chat_id})
            .eq("id", customer["id"])
            .execute()
        )
    except APIError as e:
        if e.code == "23505":
            await update.message.reply_text(
                "Bu Telegram hesabı zaten başka bir müşteriye bağlı. "
                "Yardım için yöneticinizle iletişime geçin."
            )
        else:
            await update.message.reply_text(
                "Bir hata oluştu, lütfen daha sonra tekrar deneyin."
            )
        return

    await update.message.reply_text(f"Merhaba {customer['name']}, hesabınız bağlandı ✅")


CHECK_LOOP_SECONDS = 60


async def check_loop():
    while True:
        try:
            await asyncio.to_thread(run_check_cycle)
        except Exception as e:
            print(f"[HATA] Kontrol döngüsü: {e}")
        await asyncio.sleep(CHECK_LOOP_SECONDS)


async def on_startup(app):
    asyncio.create_task(check_loop())


def main():
    app = (
        Application.builder()
        .token(os.getenv("TELEGRAM_BOT_TOKEN"))
        .post_init(on_startup)
        .build()
    )
    app.add_handler(CommandHandler("start", start))
    app.run_polling()


if __name__ == "__main__":
    main()