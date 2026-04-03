import { NextResponse } from "next/server";
import { getAuthUserFromRequest, getSupabaseServerClient } from "@/lib/video/supabaseServer";

function toTime(value) {
  const t = new Date(value || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

function buildReactionMaps(rows, currentUserId) {
  const likes = new Map();
  const dislikes = new Map();
  const mine = new Map();

  for (const row of rows || []) {
    if (row.reaction === 1) likes.set(row.comment_id, (likes.get(row.comment_id) || 0) + 1);
    if (row.reaction === -1) dislikes.set(row.comment_id, (dislikes.get(row.comment_id) || 0) + 1);
    if (currentUserId && row.user_id === currentUserId) mine.set(row.comment_id, row.reaction);
  }

  return { likes, dislikes, mine };
}

function mapComments(list, reactionMaps) {
  const root = [];
  const byId = new Map();

  (list || []).forEach((item) => {
    byId.set(item.id, {
      ...item,
      likes_count: reactionMaps.likes.get(item.id) || 0,
      dislikes_count: reactionMaps.dislikes.get(item.id) || 0,
      user_reaction: reactionMaps.mine.get(item.id) || 0,
      replies: [],
    });
  });

  byId.forEach((item) => {
    if (item.parent_id && byId.has(item.parent_id)) byId.get(item.parent_id).replies.push(item);
    else root.push(item);
  });

  return root;
}

function enrich(node) {
  const replies = (node.replies || []).map(enrich);
  const repliesCount = replies.reduce((sum, item) => sum + (item.thread_count || 1), 0);
  const engagementScore = (node.likes_count || 0) + (node.dislikes_count || 0) + repliesCount;

  return {
    ...node,
    replies,
    replies_count: repliesCount,
    engagement_score: engagementScore,
    thread_count: 1 + repliesCount,
  };
}

function sortList(list, sort) {
  const sorted = [...(list || [])];

  sorted.sort((a, b) => {
    if (sort === "oldest") {
      return toTime(a.created_at) - toTime(b.created_at);
    }

    if (sort === "top") {
      const byEngagement = (b.engagement_score || 0) - (a.engagement_score || 0);
      if (byEngagement !== 0) return byEngagement;
      return toTime(b.created_at) - toTime(a.created_at);
    }

    return toTime(b.created_at) - toTime(a.created_at);
  });

  return sorted.map((item) => ({
    ...item,
    replies: sortList(item.replies || [], sort),
  }));
}

function stripInternal(list) {
  return (list || []).map(({ thread_count, engagement_score, ...item }) => ({
    ...item,
    replies: stripInternal(item.replies || []),
  }));
}

export async function GET(request, { params }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { user } = await getAuthUserFromRequest(request);
  const { id } = await params;
  const url = new URL(request.url);
  const sortParam = String(url.searchParams.get("sort") || "latest").toLowerCase();
  const sort = ["latest", "oldest", "top"].includes(sortParam) ? sortParam : "latest";

  const { data, error } = await supabase
    .from("video_comments")
    .select("id,video_id,parent_id,user_id,body,created_at,profile:profiles!video_comments_user_id_fkey(username,display_name,avatar_url)")
    .eq("video_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const commentIds = (data || []).map((item) => item.id);
  let reactionRows = [];

  if (commentIds.length > 0) {
    const { data: reactionData, error: reactionError } = await supabase
      .from("video_comment_reactions")
      .select("comment_id,user_id,reaction")
      .in("comment_id", commentIds);

    if (reactionError && reactionError.code !== "42P01") {
      return NextResponse.json({ error: reactionError.message }, { status: 500 });
    }

    reactionRows = reactionData || [];
  }

  const maps = buildReactionMaps(reactionRows, user?.id || null);
  const tree = mapComments(data || [], maps).map(enrich);
  const sorted = sortList(tree, sort);

  return NextResponse.json({ items: stripInternal(sorted), sort });
}

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const text = String(body?.body || "").trim();
  const parentId = body?.parent_id || null;

  if (text.length < 1) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });

  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("video_comments")
      .select("id,video_id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError) return NextResponse.json({ error: parentError.message }, { status: 500 });
    if (!parent || parent.video_id !== id) return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
  }

  const { error } = await supabase.from("video_comments").insert({ video_id: id, user_id: user.id, parent_id: parentId, body: text });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await supabase.from("video_comments").select("id", { count: "exact", head: true }).eq("video_id", id);
  await supabase.from("videos").update({ comments_count: count || 0 }).eq("id", id);

  return NextResponse.json({ ok: true });
}
