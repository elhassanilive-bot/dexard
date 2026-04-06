"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import VideoGrid from "@/components/video/VideoGrid";
import { getSupabaseClient } from "@/lib/supabase/client";
import { FEED_PAGE_SIZE } from "@/lib/video/constants";

const T = {
  loading: "جاري تحميل مزيد من الفيديوهات...",
  done: "وصلت إلى نهاية النتائج",
  failed: "حدث خطأ أثناء التحميل، أعد المحاولة",
};

function mergeUniqueById(current, incoming) {
  const map = new Map();
  for (const item of current || []) map.set(item.id, item);
  for (const item of incoming || []) map.set(item.id, item);
  return Array.from(map.values());
}

export default function InfiniteVideoFeed({
  initialVideos = [],
  initialPage = 1,
  total = 0,
  q = "",
  filter = "latest",
  category = "",
  channel = "",
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [page, setPage] = useState(initialPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const sentinelRef = useRef(null);

  const hasMore = useMemo(() => page * FEED_PAGE_SIZE < total, [page, total]);

  useEffect(() => {
    setVideos(initialVideos);
    setPage(initialPage);
    setIsLoadingMore(false);
    setHasError(false);
    setRetryTick(0);
  }, [initialVideos, initialPage, q, filter, category, channel]);

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (isLoadingMore) return;

        setIsLoadingMore(true);
        setHasError(false);

        try {
          const nextPage = page + 1;
          const params = new URLSearchParams();
          params.set("page", String(nextPage));
          if (q.trim()) params.set("q", q.trim());
          if (filter.trim()) params.set("filter", filter.trim());
          if (category.trim()) params.set("category", category.trim());
          if (channel.trim()) params.set("channel", channel.trim());

          let headers;
          const supabase = await getSupabaseClient();
          if (supabase) {
            const { data: authData } = await supabase.auth.getSession();
            const token = authData?.session?.access_token || "";
            if (token) headers = { Authorization: `Bearer ${token}` };
          }

          const response = await fetch(`/api/videos?${params.toString()}`, { cache: "no-store", headers });
          if (!response.ok) throw new Error("request_failed");

          const payload = await response.json();
          const items = Array.isArray(payload?.items) ? payload.items : [];

          setVideos((prev) => mergeUniqueById(prev, items));
          setPage(nextPage);
        } catch {
          setHasError(true);
        } finally {
          setIsLoadingMore(false);
        }
      },
      { rootMargin: "700px 0px 700px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, page, q, filter, category, channel, retryTick]);

  return (
    <section className="space-y-4">
      <VideoGrid videos={videos} mode="home" />

      <div ref={sentinelRef} className="flex min-h-14 items-center justify-center">
        {isLoadingMore ? <span className="text-xs text-slate-500">{T.loading}</span> : null}
        {!isLoadingMore && hasError ? (
          <button type="button" onClick={() => setRetryTick((v) => v + 1)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600">
            {T.failed}
          </button>
        ) : null}
        {!isLoadingMore && !hasError && !hasMore && videos.length > 0 ? <span className="text-xs text-slate-400">{T.done}</span> : null}
      </div>
    </section>
  );
}
