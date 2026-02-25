import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("id,status,total_cents,created_at, centers(name)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((order: any) => ({
    order_id: order.id,
    center: order.centers?.name,
    status: order.status,
    total_cents: order.total_cents,
    created_at: order.created_at
  }));

  const csv = stringify(rows, { header: true });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="orders.csv"'
    }
  });
}
