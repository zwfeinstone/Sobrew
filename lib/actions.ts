"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, requireCustomer, requireUser } from "@/lib/auth";
import { sendNewOrderEmails, sendShippedEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

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

const centerSchema = z.object({
  name: z.string().min(2),
  contact_email: z.string().email(),
  shipping_line1: z.string().min(3),
  shipping_line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  zip: z.string().min(3),
  is_active: z.enum(["true", "false"]).optional()
});

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  sort_order: z.string().optional(),
  is_active: z.enum(["true", "false"]).optional()
});

const inviteSchema = z.object({
  email: z.string().email(),
  customer_id: z.string().uuid(),
  role: z.enum(["admin", "customer"])
});

const dollarsToCents = (value: string) => Math.round(Number(value || 0) * 100);

export async function signOutAction() {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createCenterAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const parsed = centerSchema.parse(Object.fromEntries(formData.entries()));

  const { data, error } = await supabase
    .from("centers")
    .insert({
      name: parsed.name,
      slug: parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      contact_email: parsed.contact_email,
      shipping_line1: parsed.shipping_line1,
      shipping_line2: parsed.shipping_line2 || null,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
      is_active: parsed.is_active !== "false"
    })
    .select("id")
    .single();

  if (error || !data) throw error;
  revalidatePath("/admin/centers");
  redirect(`/admin/centers/${data.id}`);
}

export async function updateCenterAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const centerId = String(formData.get("center_id"));
  const parsed = centerSchema.parse(Object.fromEntries(formData.entries()));

  const { error } = await supabase
    .from("centers")
    .update({
      name: parsed.name,
      contact_email: parsed.contact_email,
      shipping_line1: parsed.shipping_line1,
      shipping_line2: parsed.shipping_line2 || null,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
      is_active: parsed.is_active !== "false"
    })
    .eq("id", centerId);

  if (error) throw error;
  revalidatePath(`/admin/centers/${centerId}`);
  revalidatePath("/admin/centers");
}

export async function upsertCenterCatalogAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const customerId = String(formData.get("customer_id"));

  const entries: Array<{ customer_id: string; product_id: string; is_available: boolean; price_cents: number }> = [];
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("product_")) continue;
    const productId = key.replace("product_", "");
    const raw = JSON.parse(String(val)) as { is_available: boolean; price: string };
    entries.push({
      customer_id: customerId,
      product_id: productId,
      is_available: raw.is_available,
      price_cents: dollarsToCents(raw.price)
    });
  }

  if (entries.length) {
    const { error } = await supabase
      .from("customer_products")
      .upsert(entries, { onConflict: "customer_id,product_id" });
    if (error) throw error;
  }

  revalidatePath(`/admin/centers/${customerId}`);
  revalidatePath("/catalog");
}

export async function inviteUserAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const parsed = inviteSchema.parse(Object.fromEntries(formData.entries()));

  const { data: invitation, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(parsed.email, {
    redirectTo: `${env.appUrl}/auth/callback`
  });

  if (inviteError) throw inviteError;
  const userId = invitation.user?.id;
  if (!userId) throw new Error("Invite created without user id");

  const { error } = await supabase.from("profiles").upsert({
    user_id: userId,
    email: parsed.email,
    role: parsed.role,
    customer_id: parsed.role === "customer" ? parsed.customer_id : null
  });

  if (error) throw error;
  revalidatePath("/admin/users");
}

export async function reassignUserAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const userId = String(formData.get("user_id"));
  const customerId = String(formData.get("customer_id"));

  const { error } = await supabase
    .from("profiles")
    .update({ customer_id: customerId || null })
    .eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/admin/users");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const parsed = productSchema.parse(Object.fromEntries(formData.entries()));

  const { error } = await supabase.from("products").insert({
    name: parsed.name,
    sku: parsed.sku || null,
    description: parsed.description || null,
    unit: parsed.unit || null,
    sort_order: Number(parsed.sort_order || 0),
    active: parsed.is_active !== "false"
  });

  if (error) throw error;
  revalidatePath("/admin/products");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const productId = String(formData.get("product_id"));
  const parsed = productSchema.parse(Object.fromEntries(formData.entries()));

  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.name,
      sku: parsed.sku || null,
      description: parsed.description || null,
      unit: parsed.unit || null,
      sort_order: Number(parsed.sort_order || 0),
      active: parsed.is_active !== "false"
    })
    .eq("id", productId);

  if (error) throw error;
  revalidatePath("/admin/products");
}

export async function createOrderAction(formData: FormData) {
  const { user, profile } = await requireUser();
  if (profile.role !== "customer" || !profile.customer_id) throw new Error("Unauthorized");

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
      center_id: profile.customer_id,
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
    .select("*, centers(name)")
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
    centerName: (order.centers as any)?.name ?? "Center",
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
    const { data: customerUser } = await supabase
      .from("profiles")
      .select("email")
      .eq("customer_id", order.center_id)
      .eq("role", "customer")
      .limit(1)
      .single();

    if (customerUser?.email) {
      await sendShippedEmail({
        orderId: order.id,
        centerName: (order.centers as any)?.name ?? "Center",
        centerEmail: customerUser.email,
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

export async function ensureActiveCustomerAccess() {
  const profile = await requireCustomer();
  const supabase = getSupabaseServerClient();
  const { data: center } = await supabase
    .from("centers")
    .select("is_active")
    .eq("id", profile.customer_id)
    .single();

  if (!center?.is_active) {
    redirect("/login?disabled=1");
  }

  return profile;
}
