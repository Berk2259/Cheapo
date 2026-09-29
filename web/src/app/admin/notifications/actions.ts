"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteNotification(
  id: number,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_log")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Silinemedi." };
  }

  revalidatePath("/admin/notifications");
  revalidatePath("/admin/trash");
  return { ok: true };
}