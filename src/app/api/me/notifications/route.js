import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

const TYPE_MAP = {
  channel_subscribed: { filter_type: "subscriber", title: "مشترك جديد في قناتك" },
  video_commented: { filter_type: "comment", title: "تعليق جديد على فيديوك" },
  comment_replied: { filter_type: "reply", title: "رد جديد على تعليقك" },
  video_liked: { filter_type: "reaction", title: "إعجاب جديد على فيديوك" },
  video_disliked: { filter_type: "reaction", title: "عدم إعجاب جديد على فيديوك" },
  video_saved: { filter_type: "save", title: "قام شخص بحفظ فيديوك" },
};

export async function GET(request) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id,type,created_at,read_at,video_id,comment_id,actor:profiles!notifications_actor_id_fkey(id,username,display_name,avatar_url),video:videos(id,title)"
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || []).map((row) => {
    const meta = TYPE_MAP[row.type] || { filter_type: "other", title: "إشعار جديد" };
    const actorName = row.actor?.display_name || row.actor?.username || "مستخدم";

    let title = meta.title;
    if (row.type === "video_liked" || row.type === "video_disliked" || row.type === "video_saved") {
      title = `${meta.title}: ${row.video?.title || "فيديو"}`;
    }
    if (row.type === "video_commented") {
      title = `${actorName} علّق على فيديوك`;
    }
    if (row.type === "comment_replied") {
      title = `${actorName} ردّ على تعليقك`;
    }
    if (row.type === "channel_subscribed") {
      title = `${actorName} اشترك في قناتك`;
    }

    return {
      id: row.id,
      type: meta.filter_type,
      raw_type: row.type,
      created_at: row.created_at,
      read_at: row.read_at,
      actor: row.actor,
      title,
      href: row.video_id ? `/watch/${row.video_id}` : row.actor?.username ? `/channel/${row.actor.username}` : "/notifications",
    };
  });

  return NextResponse.json({ items });
}

export async function PATCH(request) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: nowIso })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, read_at: nowIso });
}
