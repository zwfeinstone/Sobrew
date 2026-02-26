import Link from "next/link";
import { LayoutShell } from "@/components/layout-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminHomePage() {
  await requireAdmin();
  return (
    <LayoutShell title="Admin Dashboard" admin>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/admin/centers" className="card hover:border-brand">Manage Centers</Link>
        <Link href="/admin/users" className="card hover:border-brand">Manage Users</Link>
        <Link href="/admin/products" className="card hover:border-brand">Manage Products</Link>
        <Link href="/admin/orders" className="card hover:border-brand">Manage Orders</Link>
      </div>
    </LayoutShell>
  );
}
