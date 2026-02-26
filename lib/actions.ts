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
  center_id: z.string().uuid(),
  role: z.enum(["admin", "center_user"])
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
  const centerId = String(formData.get("center_id"));

  const entries: Array<{ center_id: string; product_id: string; is_available: boolean; price_cents: number }> = [];

  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("product_")) continue;
    const productId = key.replace("product_", "");
    const raw = JSON.parse(String(val)) as { is_available: boolean; price: string };
    entries.push({
      center_id: centerId,
      product_id: productId,
      is_available: raw.is_available,
      price_cents: dollarsToCents(raw.price)
    });
  }

  if (entries.length) {
    const { error } = await supabase
      .from("customer_products")
      .upsert(entries, { onConflict: "center_id,product_id" });
    if (error) throw error;
  }

  revalidatePath(`/admin/centers/${centerId}`);
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

  const { error } = await supabase.from("center_users").upsert({
    user_id: userId,
    center_id: parsed.center_id,
    role: parsed.role
  });

  if (error) throw error;
  revalidatePath("/admin/users");
}

export async function reassignUserAction(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const userId = String(formData.get("user_id"));
  const centerId = String(formData.get("center_id"));

  const { error } = await supabase
    .from("center_users")
    .update({ center_id: centerId })
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
  const { user, centerUser } = await requireUser();
  const supabase = getSupabaseServerClient();

  if (centerUser.role !== "center_user") throw new Error("Unauthorized");

  const parsed = checkoutSchema.parse(Object.fromEntries(formData.entries()));
  const rawCart = JSON.parse(parsed.cart_json) as Array<Record<string, unknown>>;

  const items = rawCart.map((item) => ({
    product_id: String(item.product_id ?? ""),
    quantity: Number(item.quantity ?? 0)
  }));

  if (!items.length || items.some((item) => !item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    throw new Error("Invalid cart payload");
  }

  const { data: orderId, error: rpcError } = await supabase.rpc("create_order_from_cart", {
    p_items: items,
    p_shipping: {
      contact_name: parsed.contact_name,
      phone: parsed.phone,
      address_line1: parsed.address_line1,
      address_line2: parsed.address_line2 || null,
      city: parsed.city,
      state: parsed.state,
      postal_code: parsed.postal_code,
      po_number: parsed.po_number || null,
      notes: parsed.notes || null
    }
  });

  if (rpcError || !orderId) throw rpcError ?? new Error("Failed to create order");

  const { data: order, error: orderFetchError } = await supabase
    .from("orders")
    .select("*, centers(name), order_items(quantity,unit_price_cents,line_total_cents, products(name))")
    .eq("id", orderId)
    .single();

  if (orderFetchError || !order) throw orderFetchError;

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
    items: (order.order_items as any[]).map((item) => ({
      name: item.products.name,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      line_total_cents: item.line_total_cents
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
      .eq("role", "center_user")
      .limit(1)
      .single();

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(centerUser?.user_id ?? "");

    if (authUser.user?.email) {
      await sendShippedEmail({
        orderId: order.id,
        centerName: (order.centers as any)?.name ?? "Center",
        centerEmail: authUser.user.email,
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
     .eq("id", profile.center_id)
    .single();

  if (!center?.is_active) {
    redirect("/login?disabled=1");
  }

  return profile;
}
