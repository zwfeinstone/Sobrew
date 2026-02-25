import Image from "next/image";
import { notFound } from "next/navigation";
import { LayoutShell } from "@/components/layout-shell";
import { requireUser } from "@/lib/auth";
import { getCenterCatalog } from "@/lib/data";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { profile } = await requireUser();
  const products = await getCenterCatalog(profile.center_id);
  const product = products.find((item: any) => item.id === params.id);
  if (!product) notFound();

  return (
    <LayoutShell title={product.name} admin={profile.role === "admin"}>
      <div className="card grid gap-4 md:grid-cols-2">
        <Image
          src={product.image_url ?? "https://picsum.photos/seed/fallback/500/400"}
          alt={product.name}
          width={600}
          height={400}
          className="h-80 w-full rounded object-cover"
        />
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-slate-500">SKU: {product.sku}</p>
          <p>{product.description}</p>
          <p className="text-2xl font-semibold">${(product.price_cents / 100).toFixed(2)}</p>
        </div>
      </div>
    </LayoutShell>
  );
}
