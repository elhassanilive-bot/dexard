"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import ReactionBar from "@/components/video/ReactionBar";
import CommentsSection from "@/components/video/CommentsSection";
import SubscribeButton from "@/components/video/SubscribeButton";

export default function VideoEngagementClient({ videoId, channelUsername, likesCount, dislikesCount, userReaction, isSubscribed, subscribersCount }) {
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      const supabase = await getSupabaseClient();
      if (!supabase || !alive) return;
      const { data } = await supabase.auth.getSession();
      if (alive) setAccessToken(data?.session?.access_token || "");
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <ReactionBar
          videoId={videoId}
          initialLike={likesCount}
          initialDislike={dislikesCount}
          initialReaction={userReaction}
          accessToken={accessToken}
        />
        <SubscribeButton
          username={channelUsername}
          initialSubscribed={isSubscribed}
          initialCount={subscribersCount}
          accessToken={accessToken}
        />
      </div>

      <CommentsSection videoId={videoId} accessToken={accessToken} />
    </div>
  );
}
