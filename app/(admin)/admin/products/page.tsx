import { LayoutShell } from "@/components/layout-shell";
import { createProductAction, updateProductAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data: products } = await supabase.from("products").select("*").order("sort_order", { ascending: true });

  return (
    <LayoutShell title="Products" admin>
      <form action={createProductAction} className="card grid gap-2 md:grid-cols-7">
        <input name="name" placeholder="Name" required />
        <input name="sku" placeholder="SKU (optional)" />
        <input name="unit" placeholder="Unit" />
        <input name="sort_order" type="number" placeholder="Sort" defaultValue={0} />
        <select name="is_active" defaultValue="true">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <input name="description" placeholder="Description" className="md:col-span-2" />
        <button className="rounded bg-brand px-3 py-2 text-white">Create product</button>
      </form>

      <div className="space-y-2">
        {(products ?? []).map((product: any) => (
          <form key={product.id} action={updateProductAction} className="card grid gap-2 md:grid-cols-7">
            <input type="hidden" name="product_id" value={product.id} />
            <input name="name" defaultValue={product.name} required />
            <input name="sku" defaultValue={product.sku ?? ""} placeholder="SKU" />
            <input name="unit" defaultValue={product.unit ?? ""} placeholder="Unit" />
            <input name="sort_order" type="number" defaultValue={product.sort_order ?? 0} />
            <select name="is_active" defaultValue={product.active ? "true" : "false"}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <input name="description" defaultValue={product.description ?? ""} placeholder="Description" className="md:col-span-2" />
            <button className="w-fit rounded border px-3 py-2">Save</button>
          </form>
        ))}
      </div>
    </LayoutShell>
  );
}
