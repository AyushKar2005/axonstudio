import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const ownerKey = req.nextUrl.searchParams.get("ownerKey");

  if (!ownerKey) {
    return NextResponse.json(
      { error: "Missing ownerKey" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("experiment_runs")
    .select("*")
    .eq("owner_key", ownerKey)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ runs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    ownerKey,
    name,
    dataset,
    datasetName,
    config,
    metrics,
    snapshots,
    predictions,
  } = body;

  if (!ownerKey || !name || !dataset) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("experiment_runs")
    .insert({
      owner_key: ownerKey,
      name,
      dataset,
      dataset_name: datasetName ?? dataset,
      config: config ?? {},
      metrics: metrics ?? null,
      snapshots: snapshots ?? null,
      predictions: predictions ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ run: data });
}