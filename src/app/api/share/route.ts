import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function makeShareId() {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { name, dataset, datasetName, payload } = body;

  if (!name || !dataset || !payload) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  let shareId = makeShareId();

  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabaseAdmin
      .from("shared_runs")
      .insert({
        share_id: shareId,
        name,
        dataset,
        dataset_name: datasetName ?? dataset,
        payload,
      })
      .select("*")
      .single();

    if (!error && data) {
      return NextResponse.json({
        shareId,
        url: `/playground?run=${shareId}`,
        run: data,
      });
    }

    shareId = makeShareId();
  }

  return NextResponse.json(
    { error: "Could not create share link" },
    { status: 500 },
  );
}