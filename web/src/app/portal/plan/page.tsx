import { createClient } from "@/lib/supabase/server";
import { AdminIcon } from "@/components/admin-icons";
import { PLAN_LIMITS } from "@/lib/plan-limits";

type Feature = { text: React.ReactNode; free: boolean; soon?: boolean };

const features: Feature[] = [
    { text: <><b>{PLAN_LIMITS.free.maxCategories}</b> kategori</>, free: true },
    { text: <><b>{PLAN_LIMITS.free.maxProducts}</b> ürün takibi</>, free: true },
    { text: "Telegram bildirimi", free: true },
    { text: "Hedef fiyat ve her değişimde bildirim", free: true },
    { text: "Öncelikli destek", free: false },
    { text: "Haftalık ve aylık rapor", free: false },
    { text: "Satıcılar arası fiyat kıyası", free: false },
];

function Check({ on, gold }: { on: boolean; gold?: boolean }) {
    return (
        <span
            className={
                "grid h-5 w-5 flex-none place-items-center rounded-full " +
                (on
                    ? gold
                        ? "bg-amber-400/15 text-amber-300"
                        : "bg-emerald-500/15 text-emerald-400"
                    : "bg-zinc-800 text-zinc-500")
            }
        >
            <AdminIcon name={on ? "check" : "x"} size={12} stroke={3.2} />
        </span>
    );
}

export default async function PlanPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: customer } = await supabase
        .from("customers")
        .select("id, plan")
        .eq("auth_user_id", user?.id ?? "")
        .maybeSingle();

    if (!customer) return null;

    const { data } = await supabase
        .from("subscriptions")
        .select("product_id, products(category_id)")
        .eq("customer_id", customer.id);

    const rows = (data ?? []) as {
        product_id: number;
        products: { category_id: number } | { category_id: number }[] | null;
    }[];
    const productCount = rows.length;
    const categoryCount = new Set(
        rows
            .map((r) =>
                Array.isArray(r.products) ? r.products[0]?.category_id : r.products?.category_id,
            )
            .filter((id): id is number => typeof id === "number"),
    ).size;

    const premium = customer.plan === "premium";

    return (
        <div>
            <div className="ad-in">
                <h1 className="text-[26px] font-bold tracking-[-0.02em]">Planım</h1>
                <p className="mt-1 text-zinc-500">
                    {premium
                        ? "Premium plandasın. İstediğin kadar ürün takip edebilirsin."
                        : `Şu an Ücretsiz plandasın: ${categoryCount}/${PLAN_LIMITS.free.maxCategories} kategori, ${productCount}/${PLAN_LIMITS.free.maxProducts} ürün kullanıyorsun.`}
                </p>
            </div>

            <div className="mt-[18px] grid gap-4 md:grid-cols-2">
                {/* Ücretsiz */}
                <div
                    className={
                        "ad-in relative rounded-[20px] border bg-zinc-900 p-[22px] " +
                        (premium
                            ? "border-zinc-800"
                            : "border-emerald-500 shadow-[0_0_0_1px_#2dd4bf,0_20px_40px_-24px_#2dd4bf]")
                    }
                >
                    {!premium && (
                        <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-extrabold text-[#052e2b]">
                            Mevcut planın
                        </span>
                    )}
                    <h3 className="text-[19px] font-bold">Ücretsiz</h3>
                    <p className="mt-2 text-[32px] font-extrabold tracking-[-0.03em]">0 ₺</p>
                    <span className="text-[13px] text-zinc-500">süresiz</span>
                    <ul className="my-4 grid gap-[11px] text-[14.5px]">
                        {features.map((f, i) => (
                            <li
                                key={i}
                                className={"flex items-center gap-2.5 " + (f.free ? "" : "text-zinc-500")}
                            >
                                <Check on={f.free} />
                                <span>{f.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Premium */}
                <div
                    className={
                        "ad-in relative overflow-hidden rounded-[20px] border bg-[linear-gradient(135deg,#1c1a0d,#101e1d_65%)] p-[22px] " +
                        (premium
                            ? "border-amber-400 shadow-[0_0_0_1px_#fbbf24,0_20px_40px_-24px_#f59e0b]"
                            : "border-amber-400/40")
                    }
                    style={{ "--i": 1 } as React.CSSProperties}
                >
                    {premium && (
                        <span className="absolute right-4 top-4 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-extrabold text-[#3b2a00]">
                            Mevcut planın
                        </span>
                    )}
                    <h3 className="flex items-center gap-2.5 text-[19px] font-bold">
                        <AdminIcon name="crown" size={20} /> Premium
                    </h3>
                    <p className="mt-2 text-[32px] font-extrabold tracking-[-0.03em]">
                        Talep üzerine
                    </p>
                    <span className="text-[13px] text-zinc-500">fiyat için bize yaz</span>
                    <ul className="my-4 grid gap-[11px] text-[14.5px]">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2.5">
                                <Check on gold />
                                <span>
                                    {i === 0 ? (
                                        <>
                                            <b>Sınırsız</b> kategori
                                        </>
                                    ) : i === 1 ? (
                                        <>
                                            <b>Sınırsız</b> ürün takibi
                                        </>
                                    ) : (
                                        f.text
                                    )}
                                    {f.soon && (
                                        <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-px text-[11px] font-extrabold text-amber-300">
                                            Yakında
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {premium ? (
                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=norelsoft@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-zinc-800 px-3.5 py-2 text-[13px] font-extrabold text-zinc-50"
                        >
                            Destek al
                        </a>
                    ) : (
                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=norelsoft@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-4 py-2.5 font-extrabold text-[#3b2a00] shadow-[0_10px_24px_-10px_#f59e0b]"
                        >
                            <AdminIcon name="crown" size={16} /> Premium için yaz
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}