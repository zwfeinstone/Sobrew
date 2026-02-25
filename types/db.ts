export type Role = "admin" | "center_user";
export type OrderStatus = "New" | "Processing" | "Shipped";

export interface Center {
  id: string;
  name: string;
  slug: string;
  tier_id: string;
  logo_url: string | null;
  accent_color: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProductWithPrice {
  id: string;
  name: string;
  description: string | null;
  sku: string;
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
