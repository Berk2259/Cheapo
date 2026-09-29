"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deletePriceRecord(
  id: number,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("price_history")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Silinemedi." };
  }

  revalidatePath("/admin/price-history");
  revalidatePath("/admin/trash");
  return { ok: true };
}