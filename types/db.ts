export type Role = "admin" | "center_user";
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

export interface CenterUser {
  user_id: string;
  center_id: string;
  role: Role;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string | null;
  sort_order?: number;
  image_url: string | null;
  active: boolean;
}

export interface ProductWithPrice extends Product {
  price_cents: number;
}

export interface ProductPrice {
  id?: string;
  product_id: string;
  tier_id?: string | null;
  center_id?: string | null;
  price_cents: number;
}

export interface CartItem {
  product_id: string;
  name: string;
  image_url: string | null;
  quantity: number;
  price_cents: number;
}
