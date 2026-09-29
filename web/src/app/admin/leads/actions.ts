"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: boolean; message?: string };

const STATUSES = ["bekliyor", "inceleniyor", "tamamlandi", "reddedildi"];

export async function updateLeadStatus(
  id: number,
  status: string,
): Promise<Result> {
  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Geçersiz durum." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Kaydedilemedi." };
  }

  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function deleteLead(id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Silinemedi." };
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin/trash");
  return { ok: true };
}

export async function convertLeadToCustomer(
  leadId: number,
  input: { email: string; password: string; name: string; plan: string },
): Promise<Result> {
  const email = input.email.trim();
  const name = input.name.trim();

  if (!email) return { ok: false, message: "E-posta boş olamaz." };
  if (!name) return { ok: false, message: "Ad boş olamaz." };
  if (input.password.length < 8) {
    return { ok: false, message: "Şifre en az 8 karakter olmalı." };
  }
  if (input.plan !== "free" && input.plan !== "premium") {
    return { ok: false, message: "Geçersiz plan." };
  }

  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 1. Auth hesabı oluştur
  const { data: authUser, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password: input.password,
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

  // 2. Müşteri kaydı oluştur
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      name,
      plan: input.plan,
      auth_user_id: authUser.user.id,
    })
    .select("id")
    .single();

  if (customerError || !customer) {
    // Müşteri oluşmadıysa yetim auth hesabını temizle
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    return { ok: false, message: "Müşteri kaydı oluşturulamadı." };
  }

  // 3. Talebi tamamlandı olarak işaretle ve müşteriye bağla
  await supabase
    .from("leads")
    .update({ status: "tamamlandi", converted_customer_id: customer.id })
    .eq("id", leadId);

  revalidatePath("/admin/leads");
  revalidatePath("/admin/customers");
  return { ok: true };
}