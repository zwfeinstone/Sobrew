import { LayoutShell } from "@/components/layout-shell";
import { CenterCatalogPricingForm } from "@/components/center-catalog-pricing-form";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { updateCenterAction, upsertCenterCatalogAction } from "@/lib/actions";

export default async function AdminCenterDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  const [{ data: center }, { data: products }, { data: mappings }] = await Promise.all([
    supabase.from("centers").select("*").eq("id", params.id).single(),
    supabase
      .from("products")
      .select("id,name,sku")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_prices")
      .select("product_id,price_cents")
      .eq("center_id", params.id)
  ]);

  if (!center) return <LayoutShell title="Center not found" admin>Not found</LayoutShell>;

  return (
    <LayoutShell title={`Center: ${center.name}`} admin>
      <form action={updateCenterAction} className="card grid gap-2 md:grid-cols-2">
        <input type="hidden" name="center_id" value={center.id} />
        <input name="name" defaultValue={center.name} required />
        <input name="contact_email" type="email" defaultValue={center.contact_email ?? ""} required />
        <input name="shipping_line1" defaultValue={center.shipping_line1 ?? ""} required />
        <input name="shipping_line2" defaultValue={center.shipping_line2 ?? ""} />
        <input name="city" defaultValue={center.city ?? ""} required />
        <input name="state" defaultValue={center.state ?? ""} required />
        <input name="zip" defaultValue={center.zip ?? ""} required />
        <select name="is_active" defaultValue={center.is_active ? "true" : "false"}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="w-fit rounded bg-brand px-4 py-2 text-white">Save center</button>
      </form>

      <CenterCatalogPricingForm
        centerId={center.id}
        products={(products ?? []) as any[]}
        mappings={(mappings ?? []) as any[]}
        action={upsertCenterCatalogAction}
      />
    </LayoutShell>
  );
}
