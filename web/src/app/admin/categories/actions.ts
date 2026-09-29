"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

export async function addCategory(name: string): Promise<Result> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, message: "Kategori adı boş olamaz." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ name: trimmed });

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Bu isimde bir kategori zaten var."
          : "Kategori eklenemedi.",
    };
  }

  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function updateCategory(
  id: number,
  name: string,
): Promise<Result> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, message: "Kategori adı boş olamaz." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Bu isimde bir kategori zaten var."
          : "Kaydedilemedi.",
    };
  }

  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Silinemedi." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/trash");
  return { ok: true };
}