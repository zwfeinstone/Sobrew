import { LayoutShell } from "@/components/layout-shell";
import { inviteUserAction, reassignUserAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  const [{ data: centers }, { data: mappings }] = await Promise.all([
    supabase.from("centers").select("id,name,is_active").order("name"),
    supabase.from("center_users").select("user_id,center_id,role, centers(name,is_active)").order("created_at")
  ]);

  return (
    <LayoutShell title="Users" admin>
      <form action={inviteUserAction} className="card grid gap-2 md:grid-cols-4">
        <input name="email" type="email" placeholder="user@center.com" required />
        <select name="role" defaultValue="center_user">
          <option value="center_user">Center User</option>
          <option value="admin">Admin</option>
        </select>
        <select name="center_id" defaultValue={centers?.[0]?.id}>
          {(centers ?? []).map((center: any) => (
            <option key={center.id} value={center.id}>{center.name}</option>
          ))}
        </select>
        <button className="rounded bg-brand px-3 py-2 text-white">Invite user</button>
      </form>

      <div className="space-y-2">
        {(mappings ?? []).map((mapping: any) => (
          <form key={mapping.user_id} action={reassignUserAction} className="card grid gap-2 md:grid-cols-4 md:items-center">
            <input type="hidden" name="user_id" value={mapping.user_id} />
            <div>
              <p className="font-medium">{mapping.user_id}</p>
              <p className="text-xs text-slate-500">{mapping.role}</p>
            </div>
            <select name="center_id" defaultValue={mapping.center_id ?? ""} disabled={mapping.role === "admin"}>
              {(centers ?? []).map((center: any) => (
                <option key={center.id} value={center.id}>{center.name} {center.is_active ? "" : "(inactive)"}</option>
              ))}
            </select>
            <p className="text-sm text-slate-600">
              {(mapping.centers as any)?.name ?? "Unassigned"} {((mapping.centers as any)?.is_active === false) ? "• Center inactive" : ""}
            </p>
            <button className="w-fit rounded border px-3 py-2">Save assignment</button>
          </form>
        ))}
      </div>
    </LayoutShell>
  );
}
