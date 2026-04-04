import { NextResponse } from "next/server";
import { getAccessTokenFromRequest, getAuthUserFromRequest, getSupabaseServerClient } from "@/lib/video/supabaseServer";

export async function POST(request, { params }) {
  const token = getAccessTokenFromRequest(request);
  const supabase = getSupabaseServerClient(token || undefined);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;
  const { data, error } = await supabase.rpc("increment_video_views", { target_video_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (token) {
    const { user } = await getAuthUserFromRequest(request);
    if (user) {
      await supabase.from("watch_history").upsert(
        {
          user_id: user.id,
          video_id: id,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,video_id" }
      );
    }
  }

  return NextResponse.json({ views_count: data || 0 });
}
