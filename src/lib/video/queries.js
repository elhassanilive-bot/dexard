import { createClient } from "@supabase/supabase-js";
import { FEED_PAGE_SIZE, THUMBNAIL_BUCKET, VIDEO_BUCKET } from "@/lib/video/constants";
import { getSupabaseServerClient } from "@/lib/video/supabaseServer";

function getSignerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  const dbSchema = process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA || process.env.SUPABASE_DB_SCHEMA || 'public';
  return createClient(url, service, { auth: { persistSession: false }, db: { schema: dbSchema } });
}

async function withUrls(supabase, row) {
  if (!row) return row;

  const signer = getSignerClient() || supabase;

  const [{ data: videoSigned }, { data: thumbSigned }] = await Promise.all([
    row.video_path ? signer.storage.from(VIDEO_BUCKET).createSignedUrl(row.video_path, 60 * 60) : Promise.resolve({ data: null }),
    row.thumbnail_path ? signer.storage.from(THUMBNAIL_BUCKET).createSignedUrl(row.thumbnail_path, 60 * 60) : Promise.resolve({ data: null }),
  ]);

  return {
    ...row,
    video_url: videoSigned?.signedUrl || null,
    thumbnail_url: thumbSigned?.signedUrl || null,
  };
}

export async function listVideos({ q = "", filter = "latest", category = "", channel = "", page = 1 }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { videos: [], total: 0, error: "Supabase غير مهيأ" };

  const from = Math.max(0, (page - 1) * FEED_PAGE_SIZE);
  const to = from + FEED_PAGE_SIZE - 1;

  let query = supabase
    .from("videos")
    .select(
      `
      id,title,description,keywords,category,duration_sec,views_count,likes_count,dislikes_count,
      created_at,video_path,thumbnail_path,user_id,
      channel:profiles!videos_user_id_fkey(username,display_name,avatar_url)
    `,
      { count: "exact" }
    )
    .eq("status", "published");

  if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
  if (category.trim()) query = query.eq("category", category.trim());
  if (channel.trim()) query = query.eq("channel_username", channel.trim());

  if (filter === "most_viewed") {
    query = query.order("views_count", { ascending: false }).order("created_at", { ascending: false });
  } else if (filter === "trending") {
    query = query.order("likes_count", { ascending: false }).order("views_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);
  if (error) return { videos: [], total: 0, error: error.message };

  const videos = await Promise.all((data || []).map((row) => withUrls(supabase, row)));
  return { videos, total: count || 0, error: null };
}

export async function getVideoById(videoId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { video: null, error: "Supabase غير مهيأ" };

  const { data, error } = await supabase
    .from("videos")
    .select(
      `
      id,title,description,keywords,category,duration_sec,views_count,likes_count,dislikes_count,comments_count,
      created_at,video_path,thumbnail_path,user_id,
      channel:profiles!videos_user_id_fkey(id,username,display_name,avatar_url)
    `
    )
    .eq("id", videoId)
    .eq("status", "published")
    .maybeSingle();

  if (error) return { video: null, error: error.message };
  if (!data) return { video: null, error: null };

  return { video: await withUrls(supabase, data), error: null };
}

export async function getChannelPage(username) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { channel: null, videos: [], error: "Supabase غير مهيأ" };

  const cleanUsername = String(username || "").replace(/^@+/, "").trim();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,cover_url,bio,created_at")
    .eq("username", cleanUsername)
    .maybeSingle();

  if (profileError) return { channel: null, videos: [], error: profileError.message };
  if (!profile) return { channel: null, videos: [], error: null };

  const [{ data: videos }, { count: subscribersCount }] = await Promise.all([
    supabase
      .from("videos")
      .select("id,title,duration_sec,views_count,created_at,thumbnail_path,user_id,is_pinned,pinned_at,channel:profiles!videos_user_id_fkey(username,display_name,avatar_url)")
      .eq("user_id", profile.id)
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("pinned_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("subscriber_id", { count: "exact", head: true }).eq("channel_id", profile.id),
  ]);

  const hydratedVideos = await Promise.all((videos || []).map((row) => withUrls(supabase, row)));
  const videosCount = hydratedVideos.length;
  const totalViews = hydratedVideos.reduce((sum, item) => sum + Number(item.views_count || 0), 0);

  return {
    channel: {
      ...profile,
      subscribers_count: subscribersCount || 0,
      videos_count: videosCount,
      total_views: totalViews,
    },
    videos: hydratedVideos,
    error: null,
  };
}

