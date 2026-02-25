import { LayoutShell } from "@/components/layout-shell";
import { ProductCard } from "@/components/product-card";
import { ensureActiveCustomerAccess } from "@/lib/actions";
import { getCustomerCatalog } from "@/lib/data";

export default async function CatalogPage() {
  const profile = await ensureActiveCustomerAccess();
  const products = await getCustomerCatalog(profile.customer_id!);

  return (
    <LayoutShell title="Catalog">
      {products.length ? (
        <div className="space-y-3">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="card">No products are currently available for your center.</div>
      )}
    </LayoutShell>
  );
}
