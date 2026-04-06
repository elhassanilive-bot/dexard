import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

export async function GET(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ hidden: false });

  const { id } = await params;
  const { data, error } = await supabase
    .from("hidden_videos")
    .select("video_id")
    .eq("video_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hidden: Boolean(data) });
}

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: exists, error: existsError } = await supabase
    .from("hidden_videos")
    .select("video_id")
    .eq("video_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existsError) return NextResponse.json({ error: existsError.message }, { status: 500 });

  let hidden = false;
  if (exists) {
    const { error } = await supabase.from("hidden_videos").delete().eq("video_id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    hidden = false;
  } else {
    const { error } = await supabase.from("hidden_videos").insert({ user_id: user.id, video_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    hidden = true;
  }

  return NextResponse.json({ hidden });
}
