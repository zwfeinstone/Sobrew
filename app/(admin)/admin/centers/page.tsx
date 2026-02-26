import Link from "next/link";
import { LayoutShell } from "@/components/layout-shell";
import { createCenterAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminCentersPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data: centers } = await supabase
    .from("centers")
    .select("id,name,contact_email,city,state,is_active")
    .order("name");

  return (
    <LayoutShell title="Centers" admin>
      <form action={createCenterAction} className="card grid gap-2 md:grid-cols-4">
        <input name="name" placeholder="Center name" required />
        <input name="contact_email" type="email" placeholder="Contact email" required />
        <input name="shipping_line1" placeholder="Shipping line 1" required />
        <input name="shipping_line2" placeholder="Shipping line 2" />
        <input name="city" placeholder="City" required />
        <input name="state" placeholder="State" required />
        <input name="zip" placeholder="ZIP" required />
        <select name="is_active" defaultValue="true">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="rounded bg-brand px-3 py-2 text-white">Create center</button>
      </form>

      <div className="space-y-2">
        {(centers ?? []).map((center: any) => (
          <Link key={center.id} href={`/admin/centers/${center.id}`} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{center.name}</p>
              <p className="text-sm text-slate-600">{center.contact_email} · {center.city}, {center.state}</p>
            </div>
            <p className={center.is_active ? "text-emerald-700" : "text-red-600"}>{center.is_active ? "Active" : "Inactive"}</p>
          </Link>
        ))}
      </div>
    </LayoutShell>
  );
}
