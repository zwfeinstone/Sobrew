import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type Profile = {
  user_id: string;
  email: string;
  role: "admin" | "customer";
  customer_id: string | null;
};

export async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id,email,role,customer_id")
    .eq("user_id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  return { user, profile };
}

export async function requireAdmin() {
  const { profile } = await requireUser();
  if (profile.role !== "admin") redirect("/catalog");
  return profile;
}

export async function requireCustomer() {
  const { profile } = await requireUser();
  if (profile.role !== "customer" || !profile.customer_id) redirect("/login");
  return profile;
}
