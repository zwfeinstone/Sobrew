"use client";

export function ReorderButton({ items }: { items: Array<any> }) {
  const handleReorder = () => {
    const cart = items.map((item) => ({
      product_id: item.product_id,
      name: item.products.name,
      image_url: item.products.image_url,
      quantity: item.quantity,
      price_cents: item.unit_price_cents
    }));
    localStorage.setItem("sobrew_cart", JSON.stringify(cart));
    window.location.href = "/cart";
  };

  return (
    <button onClick={handleReorder} className="rounded bg-brand px-4 py-2 text-white">
      Reorder
    </button>
  );
}
