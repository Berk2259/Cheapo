import { createClient } from "@/lib/supabase/server";
import { PortalAccount } from "@/components/portal-account";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, telegram_chat_id, link_token, removal_requested_at")
    .eq("auth_user_id", user?.id ?? "")
    .maybeSingle();

  if (!customer) {
    return <p className="text-zinc-500">Müşteri kaydı bulunamadı.</p>;
  }

  const bound = !!customer.telegram_chat_id;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const linkUrl =
    !bound && botUsername && customer.link_token
      ? `https://t.me/${botUsername}?start=${customer.link_token}`
      : null;

  return (
    <PortalAccount
      name={customer.name}
      email={user?.email ?? ""}
      bound={bound}
      linkUrl={linkUrl}
      removalRequested={!!customer.removal_requested_at}
    />
  );
}