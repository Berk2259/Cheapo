"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

export async function rejectRemoval(id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ removal_requested_at: null })
    .eq("id", id);

  if (error) return { ok: false, message: "Reddedilemedi." };

  revalidatePath("/admin/removal-requests");
  return { ok: true };
}

export async function confirmRemoval(id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, message: "Silinemedi." };

  revalidatePath("/admin/removal-requests");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/trash");
  return { ok: true };
}