"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

async function currentCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<number | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .maybeSingle();
  return customer?.id ?? null;
}

export async function addBasketItem(productId: number): Promise<Result> {
  const supabase = await createClient();
  const customerId = await currentCustomerId(supabase);
  if (!customerId) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  // Ürün gerçekten takip ediliyor mu ve Market kategorisinde mi, kontrol et.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("product_id, products(category_id, categories(name))")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();

  const product = sub
    ? Array.isArray(sub.products)
      ? sub.products[0]
      : sub.products
    : null;
  const categories = product?.categories as
    | { name: string }
    | { name: string }[]
    | null
    | undefined;
  const categoryName = Array.isArray(categories)
    ? (categories[0]?.name ?? "")
    : (categories?.name ?? "");

  if (!sub || categoryName !== "Market") {
    return { ok: false, message: "Bu ürün alışveriş listesine eklenemez." };
  }

  const { error } = await supabase
    .from("basket_items")
    .insert({ customer_id: customerId, product_id: productId });

  if (error) {
    return { ok: false, message: "Zaten listende olabilir." };
  }

  revalidatePath("/portal/basket");
  return { ok: true };
}

export async function removeBasketItem(productId: number): Promise<Result> {
  const supabase = await createClient();
  const customerId = await currentCustomerId(supabase);
  if (!customerId) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error } = await supabase
    .from("basket_items")
    .delete()
    .eq("customer_id", customerId)
    .eq("product_id", productId);

  if (error) return { ok: false, message: "Kaldırılamadı." };

  revalidatePath("/portal/basket");
  return { ok: true };
}

export async function createMatch(
  productIds: number[],
  name: string,
): Promise<Result> {
  if (productIds.length < 2) {
    return { ok: false, message: "En az iki ürün seçmelisin." };
  }
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, message: "Grup için bir isim yaz." };
  }

  const supabase = await createClient();
  const customerId = await currentCustomerId(supabase);
  if (!customerId) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { data: match, error: matchError } = await supabase
    .from("basket_matches")
    .insert({ customer_id: customerId, name: trimmedName })
    .select("id")
    .single();

  if (matchError || !match) {
    return { ok: false, message: "Eşleştirme oluşturulamadı." };
  }

  const { error: updateError } = await supabase
    .from("basket_items")
    .update({ match_id: match.id })
    .eq("customer_id", customerId)
    .in("product_id", productIds);

  if (updateError) {
    return { ok: false, message: "Ürünler eşleştirmeye bağlanamadı." };
  }

  revalidatePath("/portal/basket");
  return { ok: true };
}

export async function removeMatch(matchId: number): Promise<Result> {
  const supabase = await createClient();
  const customerId = await currentCustomerId(supabase);
  if (!customerId) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error } = await supabase
    .from("basket_matches")
    .delete()
    .eq("id", matchId)
    .eq("customer_id", customerId);

  if (error) return { ok: false, message: "Eşleştirme kaldırılamadı." };

  revalidatePath("/portal/basket");
  return { ok: true };
}