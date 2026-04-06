"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import VideoGrid from "@/components/video/VideoGrid";
import { formatCompactNumber, formatDuration } from "@/lib/video/format";
import { getSupabaseClient } from "@/lib/supabase/client";

const T = {
  videosTab: "الفيديوهات",
  playlistsTab: "قوائم التشغيل",
  channelVideos: "فيديوهات القناة",
  channelPlaylists: "قوائم تشغيل القناة",
  videos: "فيديو",
  emptyVideos: "لا توجد فيديوهات حاليا",
  emptyPlaylists: "لا توجد قوائم تشغيل حاليا",
  createPlaylist: "إنشاء قائمة تشغيل",
  playlistTitle: "اسم القائمة",
  privacy: "الخصوصية",
  create: "إنشاء",
  creating: "جاري الإنشاء...",
  private: "خاصة",
  unlisted: "غير مدرجة",
  public: "عامة",
  playlistCreated: "تم إنشاء قائمة التشغيل",
  loadFailed: "تعذر تحميل قوائم التشغيل",
  openPlaylist: "عرض القائمة",
};

async function getAccessToken() {
  const supabase = await getSupabaseClient();
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || "";
}

function PlaylistCard({ item }) {
  const privacyLabel = item.privacy === "public" ? T.public : item.privacy === "unlisted" ? T.unlisted : T.private;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 p-3 sm:grid-cols-[220px_1fr]">
        <div className="grid grid-cols-2 gap-2">
          {(item.videos || []).slice(0, 4).map((video) => (
            <Link key={video.id} href={`/watch/${video.id}`} className="relative block aspect-video overflow-hidden rounded-lg bg-slate-200">
              {video.thumbnail_url ? (
                <Image src={video.thumbnail_url} alt={video.title || "video"} fill sizes="180px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-[10px] font-semibold text-slate-500">No Thumb</span>
              )}
              <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">{formatDuration(video.duration_sec)}</span>
            </Link>
          ))}
          {(item.videos || []).length === 0 ? (
            <div className="col-span-2 flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">{T.emptyVideos}</div>
          ) : null}
        </div>

        <div className="min-w-0 text-right">
          <Link href={`/playlist/${item.id}`} className="block truncate text-lg font-bold text-slate-900 hover:underline">{item.title}</Link>
          <p className="mt-1 text-xs text-slate-500">{privacyLabel} - {formatCompactNumber(item.videos_count || 0)} {T.videos}</p>
          {item.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.description}</p> : null}
          <div className="mt-2">
            <Link href={`/playlist/${item.id}`} className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">{T.openPlaylist}</Link>
          </div>
          {(item.videos || []).length > 0 ? (
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {item.videos.slice(0, 3).map((video) => (
                <Link key={video.id} href={`/watch/${video.id}`} className="truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {video.title || "فيديو"}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ChannelPlaylistsTab({ username, canCreate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState("private");

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/channels/${encodeURIComponent(username)}/playlists`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.loadFailed);
      setItems(Array.isArray(payload?.items) ? payload.items : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : T.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  async function createPlaylist(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || saving) return;

    setSaving(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch("/api/me/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: cleanTitle, privacy }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.loadFailed);

      setTitle("");
      await loadPlaylists();
      window.alert(T.playlistCreated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : T.loadFailed);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {canCreate ? (
        <form onSubmit={createPlaylist} className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-right text-base font-bold text-slate-900">{T.createPlaylist}</h3>
          <div className="grid gap-2 sm:grid-cols-[1fr_170px_130px]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={T.playlistTitle}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-right text-sm text-slate-800 outline-none ring-0 transition focus:border-slate-500"
            />
            <select
              value={privacy}
              onChange={(event) => setPrivacy(event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-right text-sm text-slate-700 outline-none"
            >
              <option value="private">{T.private}</option>
              <option value="unlisted">{T.unlisted}</option>
              <option value="public">{T.public}</option>
            </select>
            <button type="submit" disabled={saving || !title.trim()} className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-60">
              {saving ? T.creating : T.create}
            </button>
          </div>
          {error ? <p className="mt-2 text-right text-xs text-rose-600">{error}</p> : null}
        </form>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{T.emptyPlaylists}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => <PlaylistCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

export default function ChannelContentTabs({ channel, videos }) {
  const [activeTab, setActiveTab] = useState("videos");
  const [viewerId, setViewerId] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadViewer() {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) return;

        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUserId = sessionData?.session?.user?.id || "";
        if (mounted) setViewerId(sessionUserId);
      } catch {
        if (mounted) setViewerId("");
      }
    }

    loadViewer();
    return () => {
      mounted = false;
    };
  }, []);

  const canCreatePlaylists = useMemo(
    () => Boolean(viewerId && channel?.id && String(viewerId) === String(channel.id)),
    [viewerId, channel?.id]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("videos")}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              activeTab === "videos" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white",
            ].join(" ")}
          >
            {T.videosTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("playlists")}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              activeTab === "playlists" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white",
            ].join(" ")}
          >
            {T.playlistsTab}
          </button>
        </div>

        {activeTab === "videos" ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {formatCompactNumber(videos?.length || 0)} {T.videos}
          </span>
        ) : null}
      </div>

      {activeTab === "videos" ? (
        <div>
          <h2 className="mb-4 text-right text-xl font-bold text-slate-900">{T.channelVideos}</h2>
          <VideoGrid videos={videos} mode="channel" allowPin ownerId={channel.id} />
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-right text-xl font-bold text-slate-900">{T.channelPlaylists}</h2>
          <ChannelPlaylistsTab username={channel.username} canCreate={canCreatePlaylists} />
        </div>
      )}
    </section>
  );
}
