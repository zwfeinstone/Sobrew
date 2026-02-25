import { LayoutShell } from "@/components/layout-shell";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data: products } = await supabase.from("products").select("*").order("name");

  async function createProduct(formData: FormData) {
    "use server";
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    await supabase.from("products").insert({
      name: String(formData.get("name")),
      description: String(formData.get("description")),
      sku: String(formData.get("sku")),
      image_url: String(formData.get("image_url")),
      active: true
    });
  }

  return (
    <LayoutShell title="Admin Products" admin>
      <form action={createProduct} className="card grid gap-2 md:grid-cols-5">
        <input name="name" placeholder="Name" required />
        <input name="sku" placeholder="SKU" required />
        <input name="description" placeholder="Description" />
        <input name="image_url" placeholder="Image URL" />
        <button className="rounded bg-brand px-3 py-2 text-white">Add product</button>
      </form>
      <div className="space-y-2">
        {(products ?? []).map((product: any) => (
          <div key={product.id} className="card flex justify-between">
            <p>{product.name} ({product.sku})</p>
            <p>{product.active ? "Active" : "Inactive"}</p>
          </div>
        ))}
      </div>
    </LayoutShell>
  );
}
