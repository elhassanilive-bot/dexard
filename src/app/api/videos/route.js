import { NextResponse } from "next/server";
import { FEED_PAGE_SIZE } from "@/lib/video/constants";
import { getSupabaseServerClient, getAuthUserFromRequest } from "@/lib/video/supabaseServer";
import { slugifyUsername } from "@/lib/video/format";

export async function GET(request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const filter = url.searchParams.get("filter") || "latest";
  const category = url.searchParams.get("category") || "";
  const channel = url.searchParams.get("channel") || "";
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10));

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const from = (page - 1) * FEED_PAGE_SIZE;
  const to = from + FEED_PAGE_SIZE - 1;

  let query = supabase
    .from("videos")
    .select("id,title,description,category,duration_sec,views_count,created_at,thumbnail_path,user_id,channel:profiles!videos_user_id_fkey(username,display_name,avatar_url)", { count: "exact" })
    .eq("status", "published");

  if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
  if (category.trim()) query = query.eq("category", category.trim());
  if (channel.trim()) query = query.eq("channel_username", channel.trim());

  if (filter === "most_viewed") query = query.order("views_count", { ascending: false }).order("created_at", { ascending: false });
  else if (filter === "trending") query = query.order("likes_count", { ascending: false }).order("views_count", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data || [], total: count || 0, page, pageSize: FEED_PAGE_SIZE });
}

export async function POST(request) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const title = String(body?.title || "").trim();
  if (title.length < 3) return NextResponse.json({ error: "Title is too short" }, { status: 400 });

  const userNameFromMeta = slugifyUsername(user.user_metadata?.username || user.user_metadata?.display_name || user.email?.split("@")[0]);
  const displayName = String(user.user_metadata?.display_name || user.email?.split("@")[0] || "User").slice(0, 50);

  await supabase.from("profiles").upsert({ id: user.id, username: userNameFromMeta || `user_${user.id.slice(0, 8)}`, display_name: displayName, avatar_url: user.user_metadata?.avatar_url || null }, { onConflict: "id" });
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();

  const payload = {
    user_id: user.id,
    channel_username: profile?.username || userNameFromMeta || `user_${user.id.slice(0, 8)}`,
    title,
    description: String(body?.description || ""),
    keywords: Array.isArray(body?.keywords) ? body.keywords.slice(0, 20) : [],
    category: String(body?.category || "general").slice(0, 40),
    video_path: String(body?.video_path || ""),
    thumbnail_path: body?.thumbnail_path ? String(body.thumbnail_path) : null,
    duration_sec: Number(body?.duration_sec || 0),
    size_bytes: Number(body?.size_bytes || 0),
    status: "published",
  };

  if (!payload.video_path) return NextResponse.json({ error: "Video path is required" }, { status: 400 });

  const { data, error } = await supabase.from("videos").insert(payload).select("id,title").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ video: data }, { status: 201 });
}