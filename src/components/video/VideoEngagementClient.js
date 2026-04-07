"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import ReactionBar from "@/components/video/ReactionBar";
import CommentsSection from "@/components/video/CommentsSection";
import SubscribeButton from "@/components/video/SubscribeButton";
import SavedVideoButton from "@/components/video/SavedVideoButton";
import CopyVideoLinkButton from "@/components/video/CopyVideoLinkButton";
import DownloadVideoButton from "@/components/video/DownloadVideoButton";

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
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <ReactionBar
            videoId={videoId}
            initialLike={likesCount}
            initialDislike={dislikesCount}
            initialReaction={userReaction}
            accessToken={accessToken}
          />

          <CopyVideoLinkButton videoId={videoId} accessToken={accessToken} />
          <DownloadVideoButton videoId={videoId} accessToken={accessToken} />
          <SavedVideoButton videoId={videoId} accessToken={accessToken} />
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <SubscribeButton
            username={channelUsername}
            initialSubscribed={isSubscribed}
            initialCount={subscribersCount}
            accessToken={accessToken}
          />
        </div>
      </div>

      <CommentsSection videoId={videoId} accessToken={accessToken} />
    </div>
  );
}
