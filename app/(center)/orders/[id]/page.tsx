import Link from "next/link";
import { ReorderButton } from "@/components/reorder-button";
import { LayoutShell } from "@/components/layout-shell";
import { ensureActiveCustomerAccess } from "@/lib/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatUsd } from "@/lib/money";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const profile = await ensureActiveCustomerAccess();
  const supabase = getSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(product_id, quantity, unit_price_cents, line_total_cents, products(name, image_url))")
    .eq("id", params.id)
    .eq("center_id", profile.center_id)
    .single();

  if (!order) return <LayoutShell title="Order not found">Not found</LayoutShell>;

  return (
    <LayoutShell title={`Order ${order.id}`}>
      <div className="card space-y-2">
        <p>Status: <strong>{order.status}</strong></p>
        <p>Total: <strong>{formatUsd(order.total_cents)}</strong></p>
        <ul className="space-y-1">
          {(order.order_items as any[]).map((item, index) => (
            <li key={index} className="flex justify-between text-sm">
              <span>{item.products.name} × {item.quantity}</span>
              <span>{formatUsd(item.line_total_cents)}</span>
            </li>
          ))}
        </ul>
        <ReorderButton items={order.order_items as any[]} />
        <Link href="/orders" className="text-brand underline">Back to orders</Link>
      </div>
    </LayoutShell>
  );
}
