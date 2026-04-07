import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;

  // Keep public counters stable from the videos row itself.
  const { data: videoRow } = await supabase
    .from("videos")
    .select("likes_count,dislikes_count")
    .eq("id", id)
    .maybeSingle();

  const likes = Number(videoRow?.likes_count || 0);
  const dislikes = Number(videoRow?.dislikes_count || 0);

  let reaction = 0;
  if (user) {
    const { data: mine } = await supabase
      .from("video_reactions")
      .select("reaction")
      .eq("video_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    reaction = Number(mine?.reaction || 0);
  }

  return NextResponse.json(
    { reaction, likes_count: likes, dislikes_count: dislikes },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    },
  );
}

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
