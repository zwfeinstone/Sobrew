import Link from "next/link";
import { LayoutShell } from "@/components/layout-shell";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatUsd } from "@/lib/money";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total_cents,created_at, centers(name)")
    .order("created_at", { ascending: false });

  return (
    <LayoutShell title="Admin Orders" admin>
      <div className="flex justify-end">
        <Link href="/api/admin/export-orders" className="rounded border px-3 py-2 text-sm">Export CSV</Link>
      </div>
      <div className="space-y-2">
        {(orders ?? []).map((order: any) => (
          <Link key={order.id} href={`/admin/orders/${order.id}`} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{order.centers?.name} · {order.id}</p>
              <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <p>{order.status}</p>
            <p className="font-semibold">{formatUsd(order.total_cents)}</p>
          </Link>
        ))}
      </div>
    </LayoutShell>
  );
}
