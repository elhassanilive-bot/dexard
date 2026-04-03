import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/video/supabaseServer";

export async function GET(_request, { params }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { username } = await params;
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url,bio").eq("username", username).maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile) return NextResponse.json({ item: null });

  const [{ data: videos }, { count: subscribersCount }] = await Promise.all([
    supabase.from("videos").select("id,title,duration_sec,views_count,created_at,thumbnail_path,user_id").eq("user_id", profile.id).eq("status", "published").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("subscriber_id", { count: "exact", head: true }).eq("channel_id", profile.id),
  ]);

  return NextResponse.json({ item: { ...profile, subscribers_count: subscribersCount || 0, videos: videos || [] } });
}