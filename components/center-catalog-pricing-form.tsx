"use client";

import { useMemo, useState } from "react";

type Product = { id: string; name: string; sku: string | null };
type Mapping = { product_id: string; is_available: boolean; price_cents: number };

export function CenterCatalogPricingForm({
  centerId,
  products,
  mappings,
  action
}: {
  centerId: string;
  products: Product[];
  mappings: Mapping[];
  action: (formData: FormData) => void;
}) {
  const initial = useMemo(() => {
    const by = new Map(mappings.map((m) => [m.product_id, m]));
    return Object.fromEntries(
      products.map((p) => [
        p.id,
        {
          is_available: Boolean(by.get(p.id)?.is_available),
          price: ((by.get(p.id)?.price_cents ?? 0) / 100).toFixed(2)
        }
      ])
    ) as Record<string, { is_available: boolean; price: string }>;
  }, [products, mappings]);

  const [rows, setRows] = useState(initial);

  return (
    <form
      action={(formData) => {
        formData.set("center_id", centerId);
        Object.entries(rows).forEach(([productId, row]) => {
          formData.set(`product_${productId}`, JSON.stringify(row));
        });
        action(formData);
      }}
      className="card space-y-3"
    >
      <h2 className="text-lg font-semibold">Catalog & Pricing</h2>
      <p className="text-sm text-slate-600">Enter center-specific prices in dollars. Stored as integer cents.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Product</th>
              <th className="py-2">Available</th>
              <th className="py-2">Price ($)</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="py-2">{product.name} {product.sku ? <span className="text-slate-500">({product.sku})</span> : null}</td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    checked={rows[product.id]?.is_available ?? false}
                    onChange={(e) =>
                      setRows((prev) => ({ ...prev, [product.id]: { ...prev[product.id], is_available: e.target.checked } }))
                    }
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-28"
                    value={rows[product.id]?.price ?? "0.00"}
                    onChange={(e) =>
                      setRows((prev) => ({ ...prev, [product.id]: { ...prev[product.id], price: e.target.value } }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="rounded bg-brand px-4 py-2 text-white">Save catalog & pricing</button>
    </form>
  );
}
