import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reaction } = await request.json();
  const normalized = Number(reaction);
  if (![0, 1, -1].includes(normalized)) return NextResponse.json({ error: "Invalid reaction value" }, { status: 400 });

  if (normalized === 0) {
    await supabase.from("video_reactions").delete().eq("video_id", id).eq("user_id", user.id);
  } else {
    const { error } = await supabase.from("video_reactions").upsert({ video_id: id, user_id: user.id, reaction: normalized }, { onConflict: "video_id,user_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: counts } = await supabase.from("video_reactions").select("reaction").eq("video_id", id);
  const likes = (counts || []).filter((item) => item.reaction === 1).length;
  const dislikes = (counts || []).filter((item) => item.reaction === -1).length;
  await supabase.from("videos").update({ likes_count: likes, dislikes_count: dislikes }).eq("id", id);

  return NextResponse.json({ reaction: normalized, likes_count: likes, dislikes_count: dislikes });
}