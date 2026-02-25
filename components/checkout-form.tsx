"use client";

import { useEffect, useState } from "react";
import { createOrderAction } from "@/lib/actions";

export function CheckoutForm() {
  const [cartJson, setCartJson] = useState("[]");
  useEffect(() => {
    setCartJson(localStorage.getItem("sobrew_cart") ?? "[]");
  }, []);

  return (
    <form action={createOrderAction} className="card grid gap-3">
      <input name="contact_name" placeholder="Contact name" required />
      <input name="phone" placeholder="Phone" required />
      <input name="address_line1" placeholder="Address line 1" required />
      <input name="address_line2" placeholder="Address line 2" />
      <div className="grid gap-3 md:grid-cols-3">
        <input name="city" placeholder="City" required />
        <input name="state" placeholder="State" required />
        <input name="postal_code" placeholder="Postal code" required />
      </div>
      <input name="po_number" placeholder="PO number (optional)" />
      <textarea name="notes" placeholder="Order notes (optional)" />
      <input type="hidden" name="cart_json" value={cartJson} />
      <button className="rounded bg-brand px-4 py-2 text-white">Submit order</button>
    </form>
  );
}
