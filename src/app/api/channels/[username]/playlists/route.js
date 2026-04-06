import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { THUMBNAIL_BUCKET } from "@/lib/video/constants";
import { getAccessTokenFromRequest, getSupabaseServerClient } from "@/lib/video/supabaseServer";

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

export async function GET(request, { params }) {
  const token = getAccessTokenFromRequest(request);
  const supabase = getSupabaseServerClient(token || undefined);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { username } = await params;
  const cleanUsername = String(username || "").replace(/^@+/, "").trim();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,username,display_name")
    .eq("username", cleanUsername)
    .maybeSingle();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile) return NextResponse.json({ items: [], is_owner: false, channel_id: null });

  let viewerId = "";
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    viewerId = data?.user?.id || "";
  }

  const isOwner = Boolean(viewerId && viewerId === profile.id);

  let playlistsQuery = supabase
    .from("playlists")
    .select("id,title,description,privacy,created_at")
    .eq("owner_id", profile.id)
    .order("order_index", { ascending: true });

  if (!isOwner) playlistsQuery = playlistsQuery.eq("privacy", "public");

  const { data: playlists, error: playlistsError } = await playlistsQuery;
  if (playlistsError) return NextResponse.json({ error: playlistsError.message }, { status: 500 });

  const items = playlists || [];
  if (items.length === 0) {
    return NextResponse.json({ items: [], is_owner: isOwner, channel_id: profile.id });
  }

  const playlistIds = items.map((item) => item.id);

  const { data: links, error: linksError } = await supabase
    .from("playlist_videos")
    .select("playlist_id,created_at,order_index,video:videos!playlist_videos_video_id_fkey(id,title,duration_sec,views_count,created_at,thumbnail_path,status,user_id)")
    .in("playlist_id", playlistIds)
    .order("order_index", { ascending: true });

  if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 });

  const signer = getSignerClient() || supabase;
  const grouped = new Map();

  for (const item of items) {
    grouped.set(item.id, {
      ...item,
      videos_count: 0,
      videos: [],
    });
  }

  for (const row of links || []) {
    const target = grouped.get(row.playlist_id);
    const video = row?.video;
    if (!target || !video || video.status !== "published") continue;

    target.videos_count += 1;

    if (target.videos.length < 4) {
      const thumbnail_url = await signThumbnail(signer, video.thumbnail_path);
      target.videos.push({
        id: video.id,
        title: video.title,
        duration_sec: video.duration_sec,
        views_count: video.views_count,
        created_at: video.created_at,
        thumbnail_url,
      });
    }
  }

  return NextResponse.json({
    items: Array.from(grouped.values()),
    is_owner: isOwner,
    channel_id: profile.id,
  });
}

