import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { THUMBNAIL_BUCKET } from "@/lib/video/constants";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

function getSignerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}

export async function GET(request) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("saved_videos")
    .select("created_at,video:videos!saved_videos_video_id_fkey(id,title,duration_sec,views_count,created_at,thumbnail_path,channel:profiles!videos_user_id_fkey(username,display_name,avatar_url))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const signer = getSignerClient() || supabase;

  const items = await Promise.all(
    (data || []).map(async (row) => {
      const video = row.video;
      if (!video) return null;

      let thumbnail_url = null;
      if (video.thumbnail_path) {
        const { data: signed } = await signer.storage.from(THUMBNAIL_BUCKET).createSignedUrl(video.thumbnail_path, 60 * 60);
        thumbnail_url = signed?.signedUrl || null;
      }

      return { ...video, thumbnail_url, saved_at: row.created_at };
    })
  );

  return NextResponse.json({ items: items.filter(Boolean) });
}
