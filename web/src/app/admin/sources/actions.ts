"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

type SourceInput = {
  name: string;
  method: string;
  baseUrl: string;
  isActive: boolean;
};

const METHODS = ["api", "json_ld", "http", "browser"];

function validate(input: SourceInput): string | null {
  if (!input.name.trim()) return "Kaynak adı boş olamaz.";
  if (!METHODS.includes(input.method)) return "Geçersiz yöntem.";
  return null;
}

export async function addSource(input: SourceInput): Promise<Result> {
  const problem = validate(input);
  if (problem) return { ok: false, message: problem };

  const supabase = await createClient();
  const { error } = await supabase.from("sources").insert({
    name: input.name.trim(),
    method: input.method,
    base_url: input.baseUrl.trim() || null,
    is_active: input.isActive,
  });

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Bu isimde bir kaynak zaten var."
          : "Kaynak eklenemedi.",
    };
  }

  revalidatePath("/admin/sources");
  return { ok: true };
}

export async function updateSource(
  id: number,
  input: SourceInput,
): Promise<Result> {
  const problem = validate(input);
  if (problem) return { ok: false, message: problem };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sources")
    .update({
      name: input.name.trim(),
      method: input.method,
      base_url: input.baseUrl.trim() || null,
      is_active: input.isActive,
    })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Bu isimde bir kaynak zaten var."
          : "Kaydedilemedi.",
    };
  }

  revalidatePath("/admin/sources");
  return { ok: true };
}

export async function deleteSource(id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sources")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Silinemedi." };
  }

  revalidatePath("/admin/sources");
  revalidatePath("/admin/trash");
  return { ok: true };
}