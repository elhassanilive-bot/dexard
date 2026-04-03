import { NextResponse } from "next/server";
import { getAuthUserFromRequest, getSupabaseServerClient } from "@/lib/video/supabaseServer";

function mapComments(list) {
  const root = [];
  const byId = new Map();
  (list || []).forEach((item) => byId.set(item.id, { ...item, replies: [] }));
  byId.forEach((item) => {
    if (item.parent_id && byId.has(item.parent_id)) byId.get(item.parent_id).replies.push(item);
    else root.push(item);
  });
  return root;
}

export async function GET(_request, { params }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;
  const { data, error } = await supabase
    .from("video_comments")
    .select("id,video_id,parent_id,user_id,body,created_at,profile:profiles!video_comments_user_id_fkey(username,display_name,avatar_url)")
    .eq("video_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: mapComments(data || []) });
}

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const text = String(body?.body || "").trim();
  if (text.length < 1) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });

  const { error } = await supabase.from("video_comments").insert({ video_id: id, user_id: user.id, parent_id: body?.parent_id || null, body: text });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await supabase.from("video_comments").select("id", { count: "exact", head: true }).eq("video_id", id);
  await supabase.from("videos").update({ comments_count: count || 0 }).eq("id", id);

  return NextResponse.json({ ok: true });
}