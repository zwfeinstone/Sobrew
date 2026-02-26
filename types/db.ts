export type Role = "admin" | "customer";
export type OrderStatus = "New" | "Processing" | "Shipped";

export interface Center {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_active: boolean;
  logo_url: string | null;
  accent_color: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProductWithPrice {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string | null;
  sort_order?: number;
  image_url: string | null;
  active: boolean;
  price_cents: number;
}

export interface CartItem {
  product_id: string;
  name: string;
  image_url: string | null;
  quantity: number;
  price_cents: number;
}
