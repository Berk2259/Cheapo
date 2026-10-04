"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: boolean; message?: string };

export async function signUpCustomer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; message?: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) return { ok: false, message: "Ad boş olamaz." };
  if (!email) return { ok: false, message: "E-posta boş olamaz." };
  if (password.length < 6) {
    return { ok: false, message: "Şifre en az 6 karakter olmalı." };
  }

  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 1. Auth hesabı oluştur (admin panelin "talepten hesap aç" akışıyla aynı yöntem)
  const { data: authUser, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authUser.user) {
    return {
      ok: false,
      message:
        authError?.code === "email_exists"
          ? "Bu e-posta ile zaten bir hesap var."
          : "Hesap oluşturulamadı.",
    };
  }

  // 2. Müşteri kaydı oluştur (varsayılan: Ücretsiz plan)
  const { error: customerError } = await adminClient.from("customers").insert({
    name,
    plan: "free",
    auth_user_id: authUser.user.id,
  });

  if (customerError) {
    // Müşteri oluşmadıysa yetim auth hesabını temizle
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    return { ok: false, message: "Hesap oluşturulamadı." };
  }

  // 3. Yeni hesapla otomatik oturum aç ve portala yönlendir
  await supabase.auth.signInWithPassword({ email, password });
  redirect("/portal");
}