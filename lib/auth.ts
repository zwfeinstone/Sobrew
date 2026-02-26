import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CenterUser = {
  user_id: string;
  center_id: string;
  role: "admin" | "center_user";
};

export async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: centerUser } = await supabase
    .from("center_users")
    .select("user_id,center_id,role")
    .eq("user_id", user.id)
    .single<CenterUser>();

  if (!centerUser) redirect("/login?error=not_provisioned");

  return { user, centerUser };
}

export async function requireAdmin() {
  const { centerUser } = await requireUser();
  if (centerUser.role !== "admin") redirect("/catalog");
  return centerUser;
}

export async function requireCustomer() {
  const { centerUser } = await requireUser();
  if (centerUser.role !== "center_user" || !centerUser.center_id) redirect("/login");
  return centerUser;
}
