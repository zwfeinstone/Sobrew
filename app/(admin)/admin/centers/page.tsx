import { LayoutShell } from "@/components/layout-shell";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminCentersPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data: centers } = await supabase.from("centers").select("id,name,notes").order("name");

  async function updateNotes(formData: FormData) {
    "use server";
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    await supabase
      .from("centers")
      .update({ notes: String(formData.get("notes")) })
      .eq("id", String(formData.get("center_id")));
  }

  return (
    <LayoutShell title="Admin Centers" admin>
      <div className="space-y-3">
        {(centers ?? []).map((center: any) => (
          <form key={center.id} action={updateNotes} className="card grid gap-2">
            <input type="hidden" name="center_id" value={center.id} />
            <p className="font-medium">{center.name}</p>
            <textarea name="notes" defaultValue={center.notes ?? ""} placeholder="Internal notes" />
            <button className="w-fit rounded bg-brand px-3 py-2 text-white">Save notes</button>
          </form>
        ))}
      </div>
    </LayoutShell>
  );
}
