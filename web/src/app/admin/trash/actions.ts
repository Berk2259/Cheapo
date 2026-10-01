"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

const TRASH_TABLES = [
  "products",
  "sources",
  "categories",
  "customers",
  "subscriptions",
  "leads",
  "notification_log",
  "price_history",
  "customer_requests",
] as const;

export type TrashTable = (typeof TRASH_TABLES)[number];

const TABLE_PATH: Record<TrashTable, string> = {
  products: "/admin/products",
  sources: "/admin/sources",
  categories: "/admin/categories",
  customers: "/admin/customers",
  subscriptions: "/admin/subscriptions",
  leads: "/admin/leads",
  notification_log: "/admin/notifications",
  price_history: "/admin/price-history",
  customer_requests: "/admin/customer-requests",
};

export async function softDelete(table: TrashTable, id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, message: "Silinemedi." };

  revalidatePath(TABLE_PATH[table]);
  revalidatePath("/admin/trash");
  revalidatePath("/admin");
  return { ok: true };
}

export async function restoreFromTrash(table: TrashTable, id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) return { ok: false, message: "Geri yüklenemedi." };

  revalidatePath(TABLE_PATH[table]);
  revalidatePath("/admin/trash");
  revalidatePath("/admin");
  return { ok: true };
}

export async function permanentlyDelete(table: TrashTable, id: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) return { ok: false, message: "Kalıcı olarak silinemedi." };

  revalidatePath("/admin/trash");
  return { ok: true };
}