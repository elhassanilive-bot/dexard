import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/video/supabaseServer";

export async function GET(_request, { params }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;
  const { data, error } = await supabase
    .from("videos")
    .select("id,title,description,keywords,category,duration_sec,views_count,likes_count,dislikes_count,comments_count,created_at,video_path,thumbnail_path,user_id,channel:profiles!videos_user_id_fkey(id,username,display_name,avatar_url)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data || null });
}