import { LayoutShell } from "@/components/layout-shell";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatUsd } from "@/lib/money";
import { updateOrderStatusAction } from "@/lib/actions";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, centers(name), order_items(product_id, quantity, unit_price_cents, line_total_cents, products(name, image_url))")
    .eq("id", params.id)
    .single();

  if (!order) return <LayoutShell title="Order not found" admin>Not found</LayoutShell>;

  return (
    <LayoutShell title={`Admin Order ${order.id}`} admin>
      <div className="card space-y-3">
        <p>Center: <strong>{(order.centers as any).name}</strong></p>
        <p>Total: <strong>{formatUsd(order.total_cents)}</strong></p>
        <p>Shipping: {order.contact_name}, {order.phone}, {order.address_line1}, {order.city}, {order.state} {order.postal_code}</p>
        <form action={updateOrderStatusAction} className="flex items-center gap-2">
          <input type="hidden" name="order_id" value={order.id} />
          <select name="status" defaultValue={order.status}>
            <option>New</option>
            <option>Processing</option>
            <option>Shipped</option>
          </select>
          <button className="rounded bg-brand px-3 py-2 text-white">Update status</button>
        </form>
        <ul className="space-y-1 text-sm">
          {(order.order_items as any[]).map((item, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{item.products.name} × {item.quantity}</span>
              <span>{formatUsd(item.line_total_cents)}</span>
            </li>
          ))}
        </ul>
      </div>
    </LayoutShell>
  );
}
