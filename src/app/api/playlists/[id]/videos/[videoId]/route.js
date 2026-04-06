import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

export async function DELETE(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: playlistId, videoId } = await params;

  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("id,owner_id")
    .eq("id", playlistId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (playlistError) return NextResponse.json({ error: playlistError.message }, { status: 500 });
  if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });

  const { error } = await supabase
    .from("playlist_videos")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("video_id", videoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ removed: true });
}
