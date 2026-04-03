import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/video/supabaseServer";
import { VIDEO_BUCKET } from "@/lib/video/constants";

function getSignerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}

function buildFilename(title) {
  const base = String(title || "video")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return `${base || "video"}.mp4`;
}

export async function GET(_request, { params }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return new Response("Supabase is not configured", { status: 500 });

  const { id } = await params;

  const { data: video, error } = await supabase
    .from("videos")
    .select("id,title,video_path,status")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) return new Response(error.message, { status: 500 });
  if (!video?.video_path) return new Response("Video not found", { status: 404 });

  const filename = buildFilename(video.title);
  const signer = getSignerClient() || supabase;

  const { data: signed, error: signedError } = await signer.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(video.video_path, 60, { download: filename });

  if (signedError || !signed?.signedUrl) {
    return new Response(signedError?.message || "Failed to sign video URL", { status: 500 });
  }

  const upstream = await fetch(signed.signedUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return new Response("Failed to download video", { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
