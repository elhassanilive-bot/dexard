import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

export async function GET(request) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: comments, error } = await supabase
    .from("video_comments")
    .select("id,video_id,parent_id,body,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const commentsList = comments || [];
  const commentIds = commentsList.map((c) => c.id);
  const videoIds = Array.from(new Set(commentsList.map((c) => c.video_id).filter(Boolean)));

  const [{ data: videos }, { data: replies }, { data: reactions }] = await Promise.all([
    videoIds.length ? supabase.from("videos").select("id,title").in("id", videoIds) : Promise.resolve({ data: [] }),
    commentIds.length ? supabase.from("video_comments").select("id,parent_id").in("parent_id", commentIds) : Promise.resolve({ data: [] }),
    commentIds.length ? supabase.from("video_comment_reactions").select("comment_id,reaction").in("comment_id", commentIds) : Promise.resolve({ data: [] }),
  ]);

  const videoMap = new Map((videos || []).map((v) => [v.id, v]));

  const replyCountMap = new Map();
  for (const row of replies || []) {
    replyCountMap.set(row.parent_id, (replyCountMap.get(row.parent_id) || 0) + 1);
  }

  const reactionMap = new Map();
  for (const row of reactions || []) {
    if (!reactionMap.has(row.comment_id)) reactionMap.set(row.comment_id, { likes: 0, dislikes: 0 });
    const current = reactionMap.get(row.comment_id);
    if (row.reaction === 1) current.likes += 1;
    if (row.reaction === -1) current.dislikes += 1;
  }

  const items = commentsList.map((comment) => ({
    ...comment,
    video_title: videoMap.get(comment.video_id)?.title || "فيديو",
    replies_count: replyCountMap.get(comment.id) || 0,
    likes_count: reactionMap.get(comment.id)?.likes || 0,
    dislikes_count: reactionMap.get(comment.id)?.dislikes || 0,
  }));

  return NextResponse.json({ items });
}
