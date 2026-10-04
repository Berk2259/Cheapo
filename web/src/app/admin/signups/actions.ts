"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

export async function setSignupActive(id: number, active: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ is_active: active })
    .eq("id", id);

  if (error) return { ok: false, message: "Güncellenemedi." };

  revalidatePath("/admin/signups");
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function deleteSignup(id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, message: "Silinemedi." };

  revalidatePath("/admin/signups");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/trash");
  return { ok: true };
}