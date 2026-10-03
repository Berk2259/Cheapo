"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits";

type Result = { ok: boolean; message?: string };

type RequestProductInput = {
  productId: number;
  targetPrice: string;
  notifyOnAnyChange: boolean;
};

function parseRequestTarget(raw: string): { value: number | null; error?: string } {
  const text = raw.trim().replace(",", ".");
  if (text === "") return { value: null };
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) {
    return { value: null, error: "Hedef fiyat pozitif bir sayı olmalı." };
  }
  return { value };
}

export async function submitCustomerRequest(input: {
  categoryId: number;
  products: RequestProductInput[];
  note: string;
}): Promise<Result> {
  if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) {
    return { ok: false, message: "Kategori seç." };
  }
  if (input.products.length === 0) {
    return { ok: false, message: "En az bir ürün seç." };
  }

  const parsedProducts: {
    product_id: number;
    target_price: number | null;
    notify_on_any_change: boolean;
  }[] = [];
  for (const p of input.products) {
    const { value: target, error: targetError } = parseRequestTarget(p.targetPrice);
    if (targetError) return { ok: false, message: targetError };
    if (target === null && !p.notifyOnAnyChange) {
      return {
        ok: false,
        message:
          'Her ürün için hedef fiyat gir ya da "Her değişimde bildir"i seç, yoksa bildirim gitmez.',
      };
    }
    parsedProducts.push({
      product_id: p.productId,
      target_price: target,
      notify_on_any_change: p.notifyOnAnyChange,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .maybeSingle();

  if (!customer) {
    return { ok: false, message: "Müşteri kaydınız bulunamadı." };
  }
  const { data: customerWithPlan } = await supabase
    .from("customers")
    .select("plan")
    .eq("id", customer.id)
    .single();

  const plan = (customerWithPlan?.plan ?? "free") as Plan;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const { data: existingSubs } = await supabase
    .from("subscriptions")
    .select("product_id, products(category_id)")
    .eq("customer_id", customer.id);

  const existingProductIds = new Set(
    (existingSubs ?? []).map((s) => s.product_id),
  );
  const existingCategoryIds = new Set(
    (existingSubs ?? [])
      .map((s) => {
        const product = Array.isArray(s.products) ? s.products[0] : s.products;
        return product?.category_id;
      })
      .filter((id): id is number => typeof id === "number"),
  );

  const productIds = parsedProducts.map((p) => p.product_id);
  const newProductIds = new Set([...existingProductIds, ...productIds]);
  const newCategoryIds = new Set([...existingCategoryIds, input.categoryId]);

  if (
    newCategoryIds.size > limits.maxCategories ||
    newProductIds.size > limits.maxProducts
  ) {
    return {
      ok: false,
      message: `Ücretsiz planda en fazla ${limits.maxCategories} kategori ve ${limits.maxProducts} ürün takip edilebilir. Şu an ${existingCategoryIds.size} kategori, ${existingProductIds.size} ürün takip ediyorsunuz.`,
    };
  }

  const { data: request, error: requestError } = await supabase
    .from("customer_requests")
    .insert({
      customer_id: customer.id,
      category_id: input.categoryId,
      note: input.note.trim() || null,
    })
    .select("id")
    .single();

  if (requestError || !request) {
    return { ok: false, message: "Talep gönderilemedi." };
  }

  const { error: productsError } = await supabase
    .from("customer_request_products")
    .insert(
      parsedProducts.map((p) => ({
        request_id: request.id,
        ...p,
      })),
    );

  if (productsError) {
    return { ok: false, message: "Ürünler kaydedilemedi." };
  }

  revalidatePath("/portal/requests");
  return { ok: true };
}
export async function toggleFavorite(
  subscriptionId: number,
  favorite: boolean,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .maybeSingle();

  if (!customer) return { ok: false, message: "Müşteri kaydı bulunamadı." };

  const { error } = await supabase
    .from("subscriptions")
    .update({ is_favorite: favorite })
    .eq("id", subscriptionId)
    .eq("customer_id", customer.id);

  if (error) return { ok: false, message: "Kaydedilemedi." };

  revalidatePath("/portal");
  revalidatePath("/portal/favorites");
  return { ok: true };
}