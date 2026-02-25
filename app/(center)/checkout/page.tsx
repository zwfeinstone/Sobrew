import { CheckoutForm } from "@/components/checkout-form";
import { LayoutShell } from "@/components/layout-shell";
import { requireUser } from "@/lib/auth";

export default async function CheckoutPage() {
  const { profile } = await requireUser();
  return (
    <LayoutShell title="Checkout" admin={profile.role === "admin"}>
      <CheckoutForm />
    </LayoutShell>
  );
}
