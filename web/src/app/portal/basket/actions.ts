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

// --- Sepetler (basket_lists) ---

export async function createList(
  name: string,
  categoryId: number,
): Promise<Result & { id?: number }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Bir isim yaz." };
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { ok: false, message: "Bir sektör seç." };
  }

  const supabase = await createClient();
  const customerId = await currentCustomerId(supabase);
  if (!customerId) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { data, error } = await supabase
    .from("basket_lists")
    .insert({ customer_id: customerId, name: trimmed, category_id: categoryId })
    .select("id")
    .single();

  if (error || !data) return { ok: false, message: "Sepet oluşturulamadı." };

  revalidatePath("/portal/basket");
  return { ok: true, id: data.id };
}

export async function renameList(listId: number, name: string): Promise<Result> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Bir isim yaz." };

  const supabase = await createClient();
  const customerId = await currentCustomerId(supabase);
  if (!customerId) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error } = await supabase
    .from("basket_lists")
    .update({ name: trimmed })
    .eq("id", listId)
    .eq("customer_id", customerId);

  if (error) return { ok: false, message: "Yeniden adlandırılamadı." };

  revalidatePath("/portal/basket");
  return { ok: true };
}

export async function deleteList(listId: number): Promise<Result> {
  const supabase = await createClient();
  const customerId = await currentCustomerId(supabase);
  if (!customerId) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error } = await supabase
    .from("basket_lists")
    .delete()
    .eq("id", listId)
    .eq("customer_id", customerId);

  if (error) return { ok: false, message: "Sepet silinemedi." };

  revalidatePath("/portal/basket");
  return { ok: true };
}

// --- Sepetteki ürünler (basket_items) ---

export async function addBasketItem(
  listId: number,
  productId: number,
): Promise<Result> {
  const supabase = await createClient();
  const customerId = await currentCustomerId(supabase);
  if (!customerId) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { data: list } = await supabase
    .from("basket_lists")
    .select("id, category_id")
    .eq("id", listId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (!list) return { ok: false, message: "Sepet bulunamadı." };

  // Ürün gerçekten takip ediliyor mu ve sepetin sektörüyle aynı kategoride mi?
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("product_id, products(category_id)")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();

  const product = sub
    ? Array.isArray(sub.products)
      ? sub.products[0]
      : sub.products
    : null;

  if (!sub || !product || product.category_id !== list.category_id) {
    return { ok: false, message: "Bu ürün bu sepete eklenemez." };
  }

  const { error } = await supabase.from("basket_items").insert({
    customer_id: customerId,
    product_id: productId,
    list_id: listId,
  });

  if (error) return { ok: false, message: "Zaten sepette olabilir." };

  revalidatePath("/portal/basket");
  return { ok: true };
}

export async function removeBasketItem(
  listId: number,
  productId: number,
): Promise<Result> {
  const supabase = await createClient();
  const customerId = await currentCustomerId(supabase);
  if (!customerId) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error } = await supabase
    .from("basket_items")
    .delete()
    .eq("list_id", listId)
    .eq("product_id", productId)
    .eq("customer_id", customerId);

  if (error) return { ok: false, message: "Kaldırılamadı." };

  revalidatePath("/portal/basket");
  return { ok: true };
}

// --- Eşdeğer eşleştirme (basket_matches) ---

export async function createMatch(
  listId: number,
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
    .eq("list_id", listId)
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