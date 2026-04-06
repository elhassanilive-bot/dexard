import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: playlistId } = await params;
  const body = await request.json().catch(() => ({}));
  const videoIds = Array.isArray(body?.video_ids) ? body.video_ids.map((v) => String(v || "").trim()).filter(Boolean) : [];

  if (videoIds.length === 0) {
    return NextResponse.json({ error: "video_ids is required" }, { status: 400 });
  }

  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("id,owner_id")
    .eq("id", playlistId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (playlistError) return NextResponse.json({ error: playlistError.message }, { status: 500 });
  if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });

  const { data: existingRows, error: existingError } = await supabase
    .from("playlist_videos")
    .select("video_id")
    .eq("playlist_id", playlistId);

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const existingIds = new Set((existingRows || []).map((row) => String(row.video_id)));
  if (existingIds.size !== videoIds.length) {
    return NextResponse.json({ error: "Invalid ordering payload" }, { status: 400 });
  }

  for (const id of videoIds) {
    if (!existingIds.has(id)) {
      return NextResponse.json({ error: "Invalid ordering payload" }, { status: 400 });
    }
  }

  for (let index = 0; index < videoIds.length; index += 1) {
    const videoId = videoIds[index];
    const { error } = await supabase
      .from("playlist_videos")
      .update({ order_index: index + 1 })
      .eq("playlist_id", playlistId)
      .eq("video_id", videoId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reordered: true });
}
