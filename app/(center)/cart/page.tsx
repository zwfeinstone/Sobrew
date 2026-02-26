import { CartClient } from "@/components/cart-client";
import { LayoutShell } from "@/components/layout-shell";
import { ensureActiveCustomerAccess } from "@/lib/actions";

export default async function CartPage() {
  await ensureActiveCustomerAccess();
  return (
    <LayoutShell title="Cart">
      <CartClient />
    </LayoutShell>
  );
}
