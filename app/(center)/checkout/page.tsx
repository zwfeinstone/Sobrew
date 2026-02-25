import { CheckoutForm } from "@/components/checkout-form";
import { LayoutShell } from "@/components/layout-shell";
import { ensureActiveCustomerAccess } from "@/lib/actions";

export default async function CheckoutPage() {
  await ensureActiveCustomerAccess();
  return (
    <LayoutShell title="Checkout">
      <CheckoutForm />
    </LayoutShell>
  );
}
