import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

async function getCounts(supabase, commentId) {
  const { data } = await supabase.from("video_comment_reactions").select("reaction").eq("comment_id", commentId);
  let likes = 0;
  let dislikes = 0;

  for (const item of data || []) {
    if (item.reaction === 1) likes += 1;
    if (item.reaction === -1) dislikes += 1;
  }

  return { likes, dislikes };
}

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, commentId } = await params;
  const body = await request.json();
  const nextReaction = Number(body?.reaction || 0);

  if (![1, -1, 0].includes(nextReaction)) {
    return NextResponse.json({ error: "Reaction must be 1, -1 or 0" }, { status: 400 });
  }

  const { data: comment, error: commentError } = await supabase
    .from("video_comments")
    .select("id,video_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError) return NextResponse.json({ error: commentError.message }, { status: 500 });
  if (!comment || comment.video_id !== id) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  if (nextReaction === 0) {
    const { error: deleteError } = await supabase
      .from("video_comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  } else {
    const { error: upsertError } = await supabase
      .from("video_comment_reactions")
      .upsert(
        {
          comment_id: commentId,
          user_id: user.id,
          reaction: nextReaction,
        },
        { onConflict: "comment_id,user_id" }
      );

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const counts = await getCounts(supabase, commentId);
  return NextResponse.json({
    comment_id: commentId,
    reaction: nextReaction,
    likes_count: counts.likes,
    dislikes_count: counts.dislikes,
  });
}
