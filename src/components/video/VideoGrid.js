"use client";

import { useEffect, useState } from "react";
import VideoCard from "@/components/video/VideoCard";
import { getSupabaseClient } from "@/lib/supabase/client";

const T = {
  empty: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0645\u062a\u0627\u062d\u0629 \u062d\u0627\u0644\u064a\u064b\u0627",
};

export default function VideoGrid({ videos, mode = "home", allowPin = false, ownerId = "", onPinChanged }) {
  const [viewerId, setViewerId] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadViewer() {
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
  }, []);

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
        const isOwner = Boolean(video?.can_pin || ownerByVideo || ownerByChannel);
        const canPin = Boolean(allowPin && isOwner);

        return (
          <VideoCard
            key={video.id}
            video={video}
            mode={mode === "library" ? "library" : "home"}
            allowPin={canPin}
            isOwner={isOwner}
            onPinChanged={onPinChanged}
          />
        );
      })}
    </div>
  );
}