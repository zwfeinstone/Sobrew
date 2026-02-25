import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("center_users")
    .select("role,center_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  return { user, profile };
}

export async function requireAdmin() {
  const { profile } = await requireUser();
  if (profile.role !== "admin") redirect("/catalog");
  return profile;
}
