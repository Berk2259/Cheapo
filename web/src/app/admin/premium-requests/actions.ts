"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

export async function approvePremiumRequest(
  id: number,
  customerId: number,
): Promise<Result> {
  const supabase = await createClient();

  const { error: planError } = await supabase
    .from("customers")
    .update({ plan: "premium" })
    .eq("id", customerId);

  if (planError) return { ok: false, message: "Plan güncellenemedi." };

  const { error } = await supabase
    .from("customer_premium_requests")
    .update({ status: "onaylandi", resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, message: "Talep güncellenemedi." };

  revalidatePath("/admin/premium-requests");
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function rejectPremiumRequest(id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_premium_requests")
    .update({ status: "reddedildi", resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, message: "Reddedilemedi." };

  revalidatePath("/admin/premium-requests");
  return { ok: true };
}