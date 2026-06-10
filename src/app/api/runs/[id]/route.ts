import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ownerKey = req.nextUrl.searchParams.get("ownerKey");

  if (!id || !ownerKey) {
    return NextResponse.json(
      { error: "Missing id or ownerKey" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("experiment_runs")
    .delete()
    .eq("id", id)
    .eq("owner_key", ownerKey);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}