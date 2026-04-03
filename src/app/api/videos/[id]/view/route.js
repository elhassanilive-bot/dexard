import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/video/supabaseServer";

export async function POST(_request, { params }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;
  const { data, error } = await supabase.rpc("increment_video_views", { target_video_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ views_count: data || 0 });
}