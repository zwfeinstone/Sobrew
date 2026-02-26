"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Item = {
  product_id: string;
  name: string;
  image_url: string | null;
  quantity: number;
  price_cents: number;
};

export function CartClient() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const load = () => setItems(JSON.parse(localStorage.getItem("sobrew_cart") ?? "[]"));
    load();
    window.addEventListener("cart:updated", load);
    return () => window.removeEventListener("cart:updated", load);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price_cents, 0),
    [items]
  );

  const updateQty = (idx: number, delta: number) => {
    const next = [...items];
    next[idx].quantity = Math.max(1, next[idx].quantity + delta);
    setItems(next);
    localStorage.setItem("sobrew_cart", JSON.stringify(next));
  };

  const remove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    localStorage.setItem("sobrew_cart", JSON.stringify(next));
  };

  if (!items.length) return <div className="card">Your cart is empty.</div>;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.product_id} className="card flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-slate-600">${(item.price_cents / 100).toFixed(2)} each</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded border px-2" onClick={() => updateQty(idx, -1)}>-</button>
            <span>{item.quantity}</span>
            <button className="rounded border px-2" onClick={() => updateQty(idx, 1)}>+</button>
          </div>
          <div className="w-28 text-right font-medium">${((item.quantity * item.price_cents) / 100).toFixed(2)}</div>
          <button className="text-sm text-red-600" onClick={() => remove(idx)}>Remove</button>
        </div>
      ))}

      <div className="card flex items-center justify-between">
        <p className="text-lg font-semibold">Subtotal: ${(subtotal / 100).toFixed(2)}</p>
        <Link href="/checkout" className="rounded bg-brand px-4 py-2 text-white">Checkout</Link>
      </div>
    </div>
  );
}
