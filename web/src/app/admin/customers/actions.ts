"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";


export async function addCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("customers").insert({ name });

  revalidatePath("/admin/customers");
}

export async function deleteCustomer(id: number) {
  const supabase = await createClient();
  await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/customers");
  revalidatePath("/admin/trash");
}

export async function updateCustomer(
  id: number,
  input: {
    name: string;
    plan: string;
    telegramChatId: string;
    isActive: boolean;
    categoryIds: number[];
  },
): Promise<{ ok: boolean; message?: string }> {
  const name = input.name.trim();
  const chatIdRaw = input.telegramChatId.trim();
  const telegramChatId = chatIdRaw === "" ? null : Number(chatIdRaw);

  if (!name) {
    return { ok: false, message: "Ad boş olamaz." };
  }
  if (input.plan !== "free" && input.plan !== "premium") {
    return { ok: false, message: "Geçersiz plan." };
  }
  if (telegramChatId !== null && !Number.isInteger(telegramChatId)) {
    return { ok: false, message: "Chat ID sayı olmalı." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      name,
      plan: input.plan,
      is_active: input.isActive,
      telegram_chat_id: telegramChatId,
    })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: "Kaydedilemedi. Bu Telegram hesabı başka bir müşteriye bağlı olabilir.",
    };
  }

  // Kategori seçimini eşitle: kaldırılanları sil, eklenenleri ekle
  const { data: current } = await supabase
    .from("customer_categories")
    .select("category_id")
    .eq("customer_id", id);

  const currentIds = (current ?? []).map((row) => row.category_id);
  const toAdd = input.categoryIds.filter((c) => !currentIds.includes(c));
  const toRemove = currentIds.filter((c) => !input.categoryIds.includes(c));

  if (toRemove.length > 0) {
    await supabase
      .from("customer_categories")
      .delete()
      .eq("customer_id", id)
      .in("category_id", toRemove);
  }
  if (toAdd.length > 0) {
    await supabase
      .from("customer_categories")
      .insert(toAdd.map((category_id) => ({ customer_id: id, category_id })));
  }

  revalidatePath("/admin/customers");
  return { ok: true };
}