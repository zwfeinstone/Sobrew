import { LayoutShell } from "@/components/layout-shell";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminTiersPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data: tiers } = await supabase.from("price_tiers").select("*").order("name");

  async function createTier(formData: FormData) {
    "use server";
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    await supabase.from("price_tiers").insert({ name: String(formData.get("name")) });
  }

  return (
    <LayoutShell title="Admin Price Tiers" admin>
      <form action={createTier} className="card flex gap-2">
        <input name="name" placeholder="Tier name" required />
        <button className="rounded bg-brand px-3 py-2 text-white">Create tier</button>
      </form>
      <div className="space-y-2">
        {(tiers ?? []).map((tier: any) => (
          <div key={tier.id} className="card">{tier.name}</div>
        ))}
      </div>
    </LayoutShell>
  );
}
