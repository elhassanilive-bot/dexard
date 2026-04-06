import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

async function resolveOwnedPlaylist(supabase, userId, playlistId) {
  if (!playlistId) return { playlist: null, error: "Playlist id is required", status: 400 };

  const { data, error } = await supabase
    .from("playlists")
    .select("id,title,owner_id")
    .eq("id", playlistId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) return { playlist: null, error: error.message, status: 500 };
  if (!data) return { playlist: null, error: "Playlist not found", status: 404 };

  return { playlist: data, error: null, status: 200 };
}

async function nextOrderIndex(supabase, playlistId) {
  const { data, error } = await supabase
    .from("playlist_videos")
    .select("order_index")
    .eq("playlist_id", playlistId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { value: null, error: error.message };
  return { value: Number(data?.order_index || 0) + 1, error: null };
}

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: videoId } = await params;
  const body = await request.json().catch(() => ({}));

  let playlistId = String(body?.playlist_id || "").trim();
  const title = String(body?.title || "").trim();

  if (!playlistId && !title) {
    return NextResponse.json({ error: "playlist_id or title is required" }, { status: 400 });
  }

  let playlistTitle = "";

  if (!playlistId && title) {
    const { data: created, error: createError } = await supabase
      .from("playlists")
      .insert({
        owner_id: user.id,
        title: title.slice(0, 120),
        privacy: "private",
      })
      .select("id,title")
      .single();

    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
    playlistId = created.id;
    playlistTitle = created.title;
  }

  const owned = await resolveOwnedPlaylist(supabase, user.id, playlistId);
  if (owned.error) return NextResponse.json({ error: owned.error }, { status: owned.status });

  if (!playlistTitle) playlistTitle = owned.playlist.title;

  const { data: exists, error: existsError } = await supabase
    .from("playlist_videos")
    .select("playlist_id")
    .eq("playlist_id", playlistId)
    .eq("video_id", videoId)
    .maybeSingle();

  if (existsError) return NextResponse.json({ error: existsError.message }, { status: 500 });

  let added = false;
  if (exists) {
    const { error: deleteError } = await supabase
      .from("playlist_videos")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("video_id", videoId);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    added = false;
  } else {
    const order = await nextOrderIndex(supabase, playlistId);
    if (order.error) return NextResponse.json({ error: order.error }, { status: 500 });

    const { error: insertError } = await supabase
      .from("playlist_videos")
      .insert({
        playlist_id: playlistId,
        video_id: videoId,
        added_by: user.id,
        order_index: order.value,
      });

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    added = true;
  }

  return NextResponse.json({ added, playlist_id: playlistId, playlist_title: playlistTitle });
}
