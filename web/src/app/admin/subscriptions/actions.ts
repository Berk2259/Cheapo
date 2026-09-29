"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

function parseTarget(raw: string): { value: number | null; error?: string } {
  const text = raw.trim().replace(",", ".");
  if (text === "") return { value: null };

  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) {
    return { value: null, error: "Hedef fiyat pozitif bir sayı olmalı." };
  }
  return { value };
}

export async function addSubscription(input: {
  customerId: number;
  productId: number;
  targetPrice: string;
  notifyOnAnyChange: boolean;
}): Promise<Result> {
  if (!Number.isInteger(input.customerId) || input.customerId <= 0) {
    return { ok: false, message: "Müşteri seç." };
  }
  if (!Number.isInteger(input.productId) || input.productId <= 0) {
    return { ok: false, message: "Ürün seç." };
  }

  const { value: target, error: targetError } = parseTarget(input.targetPrice);
  if (targetError) return { ok: false, message: targetError };
  if (target === null && !input.notifyOnAnyChange) {
    return {
      ok: false,
      message:
        'Hedef fiyat gir ya da "Her değişimde bildir"i seç, yoksa bildirim gitmez.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").insert({
    customer_id: input.customerId,
    product_id: input.productId,
    target_price: target,
    notify_on_any_change: input.notifyOnAnyChange,
  });

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Bu müşteri bu ürünü zaten takip ediyor."
          : error.code === "23503"
            ? "Müşteri ya da ürün bulunamadı."
            : "Takip eklenemedi.",
    };
  }

  revalidatePath("/admin/subscriptions");
  return { ok: true };
}

export async function updateSubscription(
  id: number,
  input: { targetPrice: string; notifyOnAnyChange: boolean },
): Promise<Result> {
  const { value: target, error: targetError } = parseTarget(input.targetPrice);
  if (targetError) return { ok: false, message: targetError };
  if (target === null && !input.notifyOnAnyChange) {
    return {
      ok: false,
      message:
        'Hedef fiyat gir ya da "Her değişimde bildir"i seç, yoksa bildirim gitmez.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      target_price: target,
      notify_on_any_change: input.notifyOnAnyChange,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Kaydedilemedi." };
  }

  revalidatePath("/admin/subscriptions");
  return { ok: true };
}

export async function deleteSubscription(id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Silinemedi." };
  }

  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/trash");
  return { ok: true };
}