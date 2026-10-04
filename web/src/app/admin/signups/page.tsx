import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dayLabel } from "@/lib/time";
import { SignupsList } from "@/components/signups-list";

export default async function SignupsPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [{ data: customers, error }, { data: authData }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, plan, is_active, telegram_chat_id, created_at, auth_user_id")
      .not("auth_user_id", "is", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = new Map(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? "-"]),
  );

  const items = (customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    email: emailById.get(c.auth_user_id as string) ?? "-",
    plan: c.plan ?? "free",
    active: c.is_active,
    bound: !!c.telegram_chat_id,
    joined: dayLabel(c.created_at),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-50">
        Yeni kayıtlar
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Landing page&apos;den kendi kendine kayıt olan müşteriler, en yeni
        üstte.
      </p>

      {error && <p className="mt-6 text-sm text-red-600">Veriler alınamadı.</p>}

      <SignupsList items={items} />
    </div>
  );
}