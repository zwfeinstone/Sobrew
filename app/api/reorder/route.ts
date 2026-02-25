import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const orderId = String(formData.get("order_id"));
  const supabase = getSupabaseServerClient();
  const { data: order } = await supabase
    .from("order_items")
    .select("product_id, quantity, unit_price_cents, products(name, image_url)")
    .eq("order_id", orderId);

  const cart = (order ?? []).map((item: any) => ({
    product_id: item.product_id,
    name: item.products.name,
    image_url: item.products.image_url,
    quantity: item.quantity,
    price_cents: item.unit_price_cents
  }));

  const response = NextResponse.redirect(new URL("/cart", request.url));
  response.cookies.set("sobrew_reorder", JSON.stringify(cart));
  return response;
}
