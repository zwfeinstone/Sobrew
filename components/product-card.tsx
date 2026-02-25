"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProductWithPrice } from "@/types/db";

export function ProductCard({ product }: { product: ProductWithPrice }) {
  const [qty, setQty] = useState(1);

  const addToCart = () => {
    const current = JSON.parse(localStorage.getItem("sobrew_cart") ?? "[]");
    const existing = current.find((item: any) => item.product_id === product.id);
    if (existing) existing.quantity += qty;
    else
      current.push({
        product_id: product.id,
        name: product.name,
        image_url: product.image_url,
        quantity: qty,
        price_cents: product.price_cents
      });
    localStorage.setItem("sobrew_cart", JSON.stringify(current));
    window.dispatchEvent(new Event("cart:updated"));
  };

  return (
    <div className="card grid gap-3 md:grid-cols-[96px_1fr_auto] md:items-center">
      <Image
        src={product.image_url ?? "https://picsum.photos/seed/fallback/200/200"}
        alt={product.name}
        width={96}
        height={96}
        className="h-24 w-24 rounded object-cover"
      />
      <div>
        <Link href={`/catalog/${product.id}`} className="text-lg font-medium hover:text-brand">
          {product.name}
        </Link>
        <p className="text-sm text-slate-600">{product.description}</p>
        <p className="mt-2 font-semibold">${(product.price_cents / 100).toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          className="w-16"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <button onClick={addToCart} className="rounded bg-brand px-3 py-2 text-sm text-white">
          Add to cart
        </button>
      </div>
    </div>
  );
}
