import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

function attachCounts(items, links) {
  const countMap = new Map();
  for (const row of links || []) {
    const key = String(row?.playlist_id || "");
    if (!key) continue;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  return (items || []).map((item) => ({
    ...item,
    videos_count: countMap.get(String(item.id)) || 0,
  }));
}

export async function GET(request) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const videoId = String(url.searchParams.get("video_id") || "").trim();

  const { data: playlists, error } = await supabase
    .from("playlists")
    .select("id,title,description,privacy,created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = playlists || [];
  if (items.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const playlistIds = items.map((item) => item.id);
  const { data: allLinks, error: allLinksError } = await supabase
    .from("playlist_videos")
    .select("playlist_id")
    .in("playlist_id", playlistIds);

  if (allLinksError) return NextResponse.json({ error: allLinksError.message }, { status: 500 });

  const withCounts = attachCounts(items, allLinks);

  if (!videoId) {
    return NextResponse.json({
      items: withCounts.map((item) => ({ ...item, contains_video: false })),
    });
  }

  const { data: links, error: linksError } = await supabase
    .from("playlist_videos")
    .select("playlist_id")
    .in("playlist_id", playlistIds)
    .eq("video_id", videoId);

  if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 });

  const linked = new Set((links || []).map((row) => row.playlist_id));

  return NextResponse.json({
    items: withCounts.map((item) => ({
      ...item,
      contains_video: linked.has(item.id),
    })),
  });
}

export async function POST(request) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const privacy = String(body?.privacy || "private").trim().toLowerCase();

  if (title.length < 2) {
    return NextResponse.json({ error: "Playlist title is too short" }, { status: 400 });
  }

  if (!["private", "unlisted", "public"].includes(privacy)) {
    return NextResponse.json({ error: "Invalid playlist privacy" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("playlists")
    .insert({
      owner_id: user.id,
      title: title.slice(0, 120),
      description: description ? description.slice(0, 1000) : null,
      privacy,
    })
    .select("id,title,description,privacy,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playlist: { ...data, videos_count: 0 } }, { status: 201 });
}