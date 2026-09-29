"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

async function currentCustomer(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!customer) return null;
  return { email: user.email ?? "", customerId: customer.id };
}

export async function updateProfileName(name: string): Promise<Result> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Bir isim yaz." };

  const supabase = await createClient();
  const current = await currentCustomer(supabase);
  if (!current) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error } = await supabase
    .from("customers")
    .update({ name: trimmed })
    .eq("id", current.customerId);

  if (error) return { ok: false, message: "Kaydedilemedi." };

  revalidatePath("/portal/account");
  revalidatePath("/portal");
  return { ok: true };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<Result> {
  if (newPassword.length < 6) {
    return { ok: false, message: "Yeni şifre en az 6 karakter olmalı." };
  }

  const supabase = await createClient();
  const current = await currentCustomer(supabase);
  if (!current) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: current.email,
    password: currentPassword,
  });
  if (signInError) {
    return { ok: false, message: "Mevcut şifre yanlış." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, message: "Şifre güncellenemedi." };

  return { ok: true };
}

export async function disconnectTelegram(): Promise<Result> {
  const supabase = await createClient();
  const current = await currentCustomer(supabase);
  if (!current) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error } = await supabase
    .from("customers")
    .update({ telegram_chat_id: null })
    .eq("id", current.customerId);

  if (error) return { ok: false, message: "Bağlantı kesilemedi." };

  revalidatePath("/portal/account");
  revalidatePath("/portal");
  return { ok: true };
}

export async function requestAccountRemoval(): Promise<Result> {
  const supabase = await createClient();
  const current = await currentCustomer(supabase);
  if (!current) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error } = await supabase
    .from("customers")
    .update({ removal_requested_at: new Date().toISOString() })
    .eq("id", current.customerId);

  if (error) return { ok: false, message: "Talep gönderilemedi." };

  revalidatePath("/portal/account");
  return { ok: true };
}