import Link from "next/link";
import { LayoutShell } from "@/components/layout-shell";
import { requireUser } from "@/lib/auth";
import { getCenterOrders } from "@/lib/data";
import { formatUsd } from "@/lib/money";

export default async function OrdersPage() {
  const { profile } = await requireUser();
  const orders = await getCenterOrders(profile.center_id);

  return (
    <LayoutShell title="Order History" admin={profile.role === "admin"}>
      {!orders.length ? (
        <div className="card">No orders yet.</div>
      ) : (
        <div className="space-y-2">
          {orders.map((order: any) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">Order {order.id}</p>
                <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <p>{order.status}</p>
              <p className="font-semibold">{formatUsd(order.total_cents)}</p>
            </Link>
          ))}
        </div>
      )}
    </LayoutShell>
  );
}
