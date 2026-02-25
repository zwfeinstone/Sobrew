import Link from "next/link";
import { LayoutShell } from "@/components/layout-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminHomePage() {
  await requireAdmin();
  return (
    <LayoutShell title="Admin Dashboard" admin>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/admin/orders" className="card hover:border-brand">Manage Orders</Link>
        <Link href="/admin/products" className="card hover:border-brand">Manage Products</Link>
        <Link href="/admin/tiers" className="card hover:border-brand">Price Tiers</Link>
        <Link href="/admin/centers" className="card hover:border-brand">Centers & Notes</Link>
      </div>
    </LayoutShell>
  );
}
