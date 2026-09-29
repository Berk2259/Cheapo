import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { AdminTopbar } from "@/components/admin-topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Menüdeki kırmızı rozetler: durumu "bekliyor" olan kayıtların sayısı.
  const trashTables = [
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

  const [leads, customerRequests, ...trashCounts] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "bekliyor"),
    supabase
      .from("customer_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "bekliyor"),
    ...trashTables.map((table) =>
      supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .not("deleted_at", "is", null),
    ),
  ]);

  const trashTotal = trashCounts.reduce((sum, r) => sum + (r.count ?? 0), 0);

  const badges = {
    "/admin/leads": leads.count ?? 0,
    "/admin/customer-requests": customerRequests.count ?? 0,
    "/admin/trash": trashTotal,
  };

  return (
    <div className="force-dark min-h-screen bg-zinc-950 text-zinc-50">
      <Sidebar email={user?.email} badges={badges} />
      <div className="ml-60 min-h-screen">
        <AdminTopbar />
        <main className="px-8 py-8">{children}</main>
      </div>
    </div>
  );
}