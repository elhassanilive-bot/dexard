import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

export async function GET(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;

  if (!user) {
    return NextResponse.json({ saved: false, saved_count: 0 });
  }

  const { data, error } = await supabase
    .from("saved_videos")
    .select("video_id")
    .eq("video_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    saved: Boolean(data),
    saved_count: data ? 1 : 0,
  });
}

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: exists } = await supabase
    .from("saved_videos")
    .select("video_id")
    .eq("video_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  let saved = false;
  if (exists) {
    const { error: deleteError } = await supabase.from("saved_videos").delete().eq("video_id", id).eq("user_id", user.id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    saved = false;
  } else {
    const { error: insertError } = await supabase.from("saved_videos").insert({ video_id: id, user_id: user.id });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    saved = true;
  }

  return NextResponse.json({ saved, saved_count: saved ? 1 : 0 });
}
