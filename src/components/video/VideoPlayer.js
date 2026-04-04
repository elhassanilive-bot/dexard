"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

const T = {
  noSource: "مصدر الفيديو غير متاح",
  noSupport: "متصفحك لا يدعم تشغيل الفيديو",
};

export default function VideoPlayer({ src, poster, title, videoId }) {
  useEffect(() => {
    if (!videoId) return;

    const timer = setTimeout(async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) { await fetch(`/api/videos/${videoId}/view`, { method: "POST" }); return; }
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        await fetch(`/api/videos/${videoId}/view`, { method: "POST", headers });
      } catch {
        // ignore view tracking failures
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [videoId]);

  if (!src) {
    return <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-200 text-slate-600">{T.noSource}</div>;
  }

  return (
    <video controls playsInline preload="metadata" poster={poster || undefined} muted className="aspect-video w-full rounded-2xl bg-black" title={title}>
      <source src={src} />
      {T.noSupport}
    </video>
  );
}


