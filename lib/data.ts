import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getBranding(centerId?: string) {
  const supabase = getSupabaseServerClient();
  if (!centerId) {
    return {
      name: process.env.BRAND_NAME ?? "SoBrew Wholesale",
      logo_url: process.env.BRAND_LOGO_URL ?? "",
      accent_color: process.env.BRAND_PRIMARY_COLOR ?? "#1455A6"
    };
  }

  const { data } = await supabase
    .from("centers")
    .select("name,logo_url,accent_color")
    .eq("id", centerId)
    .single();

  return {
    name: data?.name ?? process.env.BRAND_NAME ?? "SoBrew Wholesale",
    logo_url: data?.logo_url ?? process.env.BRAND_LOGO_URL ?? "",
    accent_color: data?.accent_color ?? process.env.BRAND_PRIMARY_COLOR ?? "#1455A6"
  };
}

export async function getCenterCatalog(centerId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("catalog_for_center", { p_center_id: centerId });
  if (error) throw error;
  return data ?? [];
}

export async function getCenterOrders(centerId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,status,total_cents,created_at")
    .eq("center_id", centerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
