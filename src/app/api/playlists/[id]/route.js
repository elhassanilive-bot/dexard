import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { THUMBNAIL_BUCKET } from "@/lib/video/constants";
import { getAccessTokenFromRequest, getAuthUserFromRequest, getSupabaseServerClient } from "@/lib/video/supabaseServer";

const ALLOWED_PRIVACY = new Set(["private", "unlisted", "public"]);

function getSignerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}

async function signThumbnail(signer, path) {
  if (!path) return null;
  const { data } = await signer.storage.from(THUMBNAIL_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl || null;
}

async function getOwnedPlaylist(supabase, playlistId, userId) {
  const { data, error } = await supabase
    .from("playlists")
    .select("id,owner_id,title,description,privacy,created_at,updated_at")
    .eq("id", playlistId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) return { data: null, error: error.message, status: 500 };
  if (!data) return { data: null, error: "Playlist not found", status: 404 };
  return { data, error: null, status: 200 };
}

export async function GET(request, { params }) {
  const token = getAccessTokenFromRequest(request);
  const supabase = getSupabaseServerClient(token || undefined);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;

  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("id,owner_id,title,description,privacy,created_at,updated_at,owner:profiles!playlists_owner_id_fkey(id,username,display_name,avatar_url)")
    .eq("id", id)
    .maybeSingle();

  if (playlistError) return NextResponse.json({ error: playlistError.message }, { status: 500 });
  if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });

  let viewerId = "";
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    viewerId = data?.user?.id || "";
  }

  const isOwner = Boolean(viewerId && viewerId === playlist.owner_id);
  if (!isOwner && playlist.privacy !== "public") {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const { data: rows, error: rowsError } = await supabase
    .from("playlist_videos")
    .select("created_at,order_index,video:videos!playlist_videos_video_id_fkey(id,title,description,duration_sec,views_count,created_at,thumbnail_path,user_id,status,channel:profiles!videos_user_id_fkey(username,display_name,avatar_url))")
    .eq("playlist_id", id)
    .order("order_index", { ascending: true });

  if (rowsError) return NextResponse.json({ error: rowsError.message }, { status: 500 });

  const signer = getSignerClient() || supabase;
  const items = [];

  for (const row of rows || []) {
    const video = row?.video;
    if (!video) continue;
    if (!isOwner && video.status !== "published") continue;

    const thumbnail_url = await signThumbnail(signer, video.thumbnail_path);
    items.push({
      ...video,
      thumbnail_url,
      added_at: row.created_at,
      order_index: Number(row.order_index || 0),
    });
  }

  return NextResponse.json({
    item: {
      ...playlist,
      is_owner: isOwner,
      videos_count: items.length,
      videos: items,
    },
  });
}

export async function PATCH(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await getOwnedPlaylist(supabase, id, user.id);
  if (owned.error) return NextResponse.json({ error: owned.error }, { status: owned.status });

  const body = await request.json().catch(() => ({}));
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const privacy = String(body?.privacy || "").trim().toLowerCase();

  if (title.length < 2) return NextResponse.json({ error: "Playlist title is too short" }, { status: 400 });
  if (!ALLOWED_PRIVACY.has(privacy)) return NextResponse.json({ error: "Invalid playlist privacy" }, { status: 400 });

  const { data, error } = await supabase
    .from("playlists")
    .update({
      title: title.slice(0, 120),
      description: description ? description.slice(0, 1000) : null,
      privacy,
    })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id,title,description,privacy,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await getOwnedPlaylist(supabase, id, user.id);
  if (owned.error) return NextResponse.json({ error: owned.error }, { status: owned.status });

  const { error } = await supabase.from("playlists").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}


