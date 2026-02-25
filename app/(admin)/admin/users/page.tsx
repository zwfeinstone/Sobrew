import { LayoutShell } from "@/components/layout-shell";
import { inviteUserAction, reassignUserAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  const [{ data: centers }, { data: profiles }] = await Promise.all([
    supabase.from("centers").select("id,name,is_active").order("name"),
    supabase.from("profiles").select("user_id,email,role,customer_id, centers(name,is_active)").order("email")
  ]);

  return (
    <LayoutShell title="Users" admin>
      <form action={inviteUserAction} className="card grid gap-2 md:grid-cols-4">
        <input name="email" type="email" placeholder="user@center.com" required />
        <select name="role" defaultValue="customer">
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <select name="customer_id" defaultValue={centers?.[0]?.id}>
          {(centers ?? []).map((center: any) => (
            <option key={center.id} value={center.id}>{center.name}</option>
          ))}
        </select>
        <button className="rounded bg-brand px-3 py-2 text-white">Invite user</button>
      </form>

      <div className="space-y-2">
        {(profiles ?? []).map((profile: any) => (
          <form key={profile.user_id} action={reassignUserAction} className="card grid gap-2 md:grid-cols-4 md:items-center">
            <input type="hidden" name="user_id" value={profile.user_id} />
            <div>
              <p className="font-medium">{profile.email}</p>
              <p className="text-xs text-slate-500">{profile.role}</p>
            </div>
            <select name="customer_id" defaultValue={profile.customer_id ?? ""} disabled={profile.role === "admin"}>
              <option value="">No center</option>
              {(centers ?? []).map((center: any) => (
                <option key={center.id} value={center.id}>{center.name} {center.is_active ? "" : "(inactive)"}</option>
              ))}
            </select>
            <p className="text-sm text-slate-600">
              {(profile.centers as any)?.name ?? "Unassigned"} {((profile.centers as any)?.is_active === false) ? "• Center inactive" : ""}
            </p>
            <button className="w-fit rounded border px-3 py-2">Save assignment</button>
          </form>
        ))}
      </div>
    </LayoutShell>
  );
}
