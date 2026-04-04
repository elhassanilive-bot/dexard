"use client";

import { useEffect, useState } from "react";
import VideoCard from "@/components/video/VideoCard";
import { getSupabaseClient } from "@/lib/supabase/client";

const T = {
  empty: "لا توجد فيديوهات متاحة حاليًا",
};

export default function VideoGrid({ videos, mode = "home", allowPin = false, ownerId = "", onPinChanged }) {
  const [viewerId, setViewerId] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadViewer() {
      if (!allowPin) {
        if (mounted) setViewerId("");
        return;
      }

      try {
        const supabase = await getSupabaseClient();
        if (!supabase) return;

        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUserId = sessionData?.session?.user?.id || "";
        if (sessionUserId) {
          if (mounted) setViewerId(sessionUserId);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (mounted) setViewerId(userData?.user?.id || "");
      } catch {
        if (mounted) setViewerId("");
      }
    }

    loadViewer();
    return () => {
      mounted = false;
    };
  }, [allowPin]);

  if (!videos?.length) {
    return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{T.empty}</div>;
  }

  const gridClass = mode === "library"
    ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    : mode === "channel"
      ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={gridClass}>
      {videos.map((video) => {
        const ownerByVideo = Boolean(viewerId && video?.user_id && String(viewerId) === String(video.user_id));
        const ownerByChannel = Boolean(viewerId && ownerId && String(viewerId) === String(ownerId));
        const canPin = Boolean(allowPin && (video?.can_pin || ownerByVideo || ownerByChannel));

        return (
          <VideoCard
            key={video.id}
            video={video}
            mode={mode === "library" ? "library" : "home"}
            allowPin={canPin}
            onPinChanged={onPinChanged}
          />
        );
      })}
    </div>
  );
}
