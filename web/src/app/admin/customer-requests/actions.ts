"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

const STATUSES = ["bekliyor", "inceleniyor", "tamamlandi", "reddedildi"];

export async function updateCustomerRequestStatus(
  id: number,
  status: string,
): Promise<Result> {
  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Geçersiz durum." };
  }

  const supabase = await createClient();

  const { data: request } = await supabase
    .from("customer_requests")
    .select("customer_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("customer_requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Kaydedilemedi." };
  }

  // Tamamlandı işaretlenince seçilen ürünleri otomatik takibe ekle
  if (status === "tamamlandi" && request) {
    const { data: items } = await supabase
      .from("customer_request_products")
      .select("product_id")
      .eq("request_id", id);

    if (items && items.length > 0) {
      await supabase.from("subscriptions").upsert(
        items.map((item) => ({
          customer_id: request.customer_id,
          product_id: item.product_id,
        })),
        { onConflict: "customer_id,product_id", ignoreDuplicates: true },
      );
    }
  }

  revalidatePath("/admin/customer-requests");
  revalidatePath("/admin/subscriptions");
  return { ok: true };
}

export async function deleteCustomerRequest(id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_requests")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Silinemedi." };
  }

  revalidatePath("/admin/customer-requests");
  revalidatePath("/admin/trash");
  return { ok: true };
}