import { CartClient } from "@/components/cart-client";
import { LayoutShell } from "@/components/layout-shell";
import { requireUser } from "@/lib/auth";

export default async function CartPage() {
  const { profile } = await requireUser();
  return (
    <LayoutShell title="Cart" admin={profile.role === "admin"}>
      <CartClient />
    </LayoutShell>
  );
}
