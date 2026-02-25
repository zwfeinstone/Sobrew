"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";
import { sendNewOrderEmails, sendShippedEmail } from "@/lib/email";

const checkoutSchema = z.object({
  contact_name: z.string().min(2),
  phone: z.string().min(7),
  address_line1: z.string().min(4),
  address_line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postal_code: z.string().min(3),
  notes: z.string().optional(),
  po_number: z.string().optional(),
  cart_json: z.string().min(2)
});

export async function signOutAction() {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createOrderAction(formData: FormData) {
  const { user, profile } = await requireUser();
  const parsed = checkoutSchema.parse(Object.fromEntries(formData.entries()));
  const cart = JSON.parse(parsed.cart_json) as Array<{
    product_id: string;
    quantity: number;
    price_cents: number;
    name: string;
  }>;

  const total = cart.reduce((sum, item) => sum + item.quantity * item.price_cents, 0);
  const supabase = getSupabaseServerClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      center_id: profile.center_id,
      status: "New",
      contact_name: parsed.contact_name,
      phone: parsed.phone,
      address_line1: parsed.address_line1,
      address_line2: parsed.address_line2 || null,
      city: parsed.city,
      state: parsed.state,
      postal_code: parsed.postal_code,
      notes: parsed.notes || null,
      po_number: parsed.po_number || null,
      total_cents: total
    })
    .select("*")
    .single();

  if (orderError || !order) throw orderError;

  const items = cart.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price_cents: item.price_cents,
    line_total_cents: item.quantity * item.price_cents
  }));

  const { error: itemError } = await supabase.from("order_items").insert(items);
  if (itemError) throw itemError;

  await sendNewOrderEmails({
    orderId: order.id,
    centerName: user.user_metadata.center_name ?? "Center",
    centerEmail: user.email ?? "",
    createdAt: order.created_at,
    shipping: {
      contact_name: order.contact_name,
      phone: order.phone,
      address_line1: order.address_line1,
      address_line2: order.address_line2,
      city: order.city,
      state: order.state,
      postal_code: order.postal_code
    },
    notes: order.notes,
    po_number: order.po_number,
    total_cents: order.total_cents,
    items: cart.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_price_cents: item.price_cents,
      line_total_cents: item.quantity * item.price_cents
    }))
  });

  revalidatePath("/orders");
  redirect(`/orders/${order.id}?success=1`);
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const orderId = String(formData.get("order_id"));
  const status = String(formData.get("status"));

  const { data: order } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("*, centers(name), order_items(product_id, quantity,unit_price_cents,line_total_cents, products(name, image_url))")
    .single();

  if (status === "Shipped" && order) {
    const { data: centerUser } = await supabase
      .from("center_users")
      .select("user_id")
      .eq("center_id", order.center_id)
      .limit(1)
      .single();
    const { data: userData } = await supabase.auth.admin.getUserById(centerUser?.user_id ?? "");
    if (userData.user?.email) {
      await sendShippedEmail({
        orderId: order.id,
        centerName: (order.centers as any)?.name ?? "Center",
        centerEmail: userData.user.email,
        createdAt: order.created_at,
        shipping: {
          contact_name: order.contact_name,
          phone: order.phone,
          address_line1: order.address_line1,
          address_line2: order.address_line2,
          city: order.city,
          state: order.state,
          postal_code: order.postal_code
        },
        notes: order.notes,
        po_number: order.po_number,
        total_cents: order.total_cents,
        items: (order.order_items as any[]).map((i) => ({
          name: i.products.name,
          quantity: i.quantity,
          unit_price_cents: i.unit_price_cents,
          line_total_cents: i.line_total_cents
        }))
      });
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
}
