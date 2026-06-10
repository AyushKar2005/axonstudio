import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  context: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await context.params;

  if (!shareId) {
    return NextResponse.json(
      { error: "Missing shareId" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("shared_runs")
    .select("*")
    .eq("share_id", shareId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Shared run not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ run: data });
}