"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VideoGrid from "@/components/video/VideoGrid";
import { formatCompactNumber } from "@/lib/video/format";
import { getSupabaseClient } from "@/lib/supabase/client";

const T = {
  notFound: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062a\u0634\u063a\u064a\u0644 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629",
  loadFailed: "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062a\u0634\u063a\u064a\u0644",
  videos: "\u0641\u064a\u062f\u064a\u0648",
  views: "\u0645\u0634\u0627\u0647\u062f\u0629",
  by: "\u0628\u0648\u0627\u0633\u0637\u0629",
  private: "\u062e\u0627\u0635\u0629",
  unlisted: "\u063a\u064a\u0631 \u0645\u062f\u0631\u062c\u0629",
  public: "\u0639\u0627\u0645\u0629",
  empty: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u062f\u0627\u062e\u0644 \u0647\u0630\u0647 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u062d\u0627\u0644\u064a\u0627",
  save: "\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a",
  saving: "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...",
  deletePlaylist: "\u062d\u0630\u0641 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  deletingPlaylist: "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0630\u0641...",
  confirmDeletePlaylist: "\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062a\u0634\u063a\u064a\u0644 \u0646\u0647\u0627\u0626\u064a\u0627\u061f",
  removeVideo: "\u0625\u0632\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  updateDone: "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  removeDone: "\u062a\u0645\u062a \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  reorderTitle: "\u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a",
  reorderHint: "\u0627\u0633\u062d\u0628 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0648\u0623\u0641\u0644\u062a\u0647 \u0644\u062a\u063a\u064a\u064a\u0631 \u062a\u0631\u062a\u064a\u0628\u0647",
  saveOrder: "\u062d\u0641\u0638 \u0627\u0644\u062a\u0631\u062a\u064a\u0628",
  savingOrder: "\u062c\u0627\u0631\u064a \u062d\u0641\u0638 \u0627\u0644\u062a\u0631\u062a\u064a\u0628...",
  orderSaved: "\u062a\u0645 \u062d\u0641\u0638 \u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  copyLink: "\u0646\u0633\u062e \u0631\u0627\u0628\u0637 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  share: "\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  copied: "\u062a\u0645 \u0646\u0633\u062e \u0631\u0627\u0628\u0637 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  untitledPlaylist: "\u0642\u0627\u0626\u0645\u0629 \u062a\u0634\u063a\u064a\u0644",
  untitledVideo: "\u0641\u064a\u062f\u064a\u0648",
};

function privacyLabel(value) {
  if (value === "public") return T.public;
  if (value === "unlisted") return T.unlisted;
  return T.private;
}

async function getAccessToken() {
  const supabase = await getSupabaseClient();
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || "";
}

function moveItem(list, fromId, toId) {
  const fromIndex = list.findIndex((item) => String(item.id) === String(fromId));
  const toIndex = list.findIndex((item) => String(item.id) === String(toId));
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return list;

  const clone = [...list];
  const [moved] = clone.splice(fromIndex, 1);
  clone.splice(toIndex, 0, moved);
  return clone;
}

export default function PlaylistDetailsPageClient({ playlistId }) {
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [dragId, setDragId] = useState("");
  const [dragOverId, setDragOverId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("private");
  const [initialOrderIds, setInitialOrderIds] = useState([]);

  const videos = useMemo(() => (Array.isArray(item?.videos) ? item.videos : []), [item]);
  const currentOrderIds = useMemo(() => videos.map((video) => String(video.id)), [videos]);
  const isOrderDirty = useMemo(() => currentOrderIds.join(",") !== initialOrderIds.join(","), [currentOrderIds, initialOrderIds]);

  const hydrateForm = useCallback((nextItem) => {
    setTitle(String(nextItem?.title || ""));
    setDescription(String(nextItem?.description || ""));
    setPrivacy(String(nextItem?.privacy || "private"));
    setInitialOrderIds(Array.isArray(nextItem?.videos) ? nextItem.videos.map((video) => String(video.id)) : []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 404) throw new Error(T.notFound);
        throw new Error(payload?.error || T.loadFailed);
      }

      const nextItem = payload?.item || null;
      setItem(nextItem);
      if (nextItem?.is_owner) hydrateForm(nextItem);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : T.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [hydrateForm, playlistId]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyPlaylistLink() {
    try {
      const url = `${window.location.origin}/playlist/${playlistId}`;
      await navigator.clipboard.writeText(url);
      window.alert(T.copied);
    } catch {
      window.alert(T.loadFailed);
    }
  }

  async function sharePlaylistLink() {
    const url = `${window.location.origin}/playlist/${playlistId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item?.title || T.untitledPlaylist, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      window.alert(T.copied);
    } catch {
      // ignore
    }
  }

  async function savePlaylist(event) {
    event.preventDefault();
    if (!item?.is_owner || saving) return;

    const cleanTitle = title.trim();
    if (cleanTitle.length < 2) return;

    setSaving(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: cleanTitle, description: description.trim(), privacy }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.loadFailed);

      setItem((prev) => (prev ? { ...prev, ...payload.item } : prev));
      window.alert(T.updateDone);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : T.loadFailed);
    } finally {
      setSaving(false);
    }
  }

  async function deletePlaylist() {
    if (!item?.is_owner || deleting) return;
    if (!window.confirm(T.confirmDeletePlaylist)) return;

    setDeleting(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.loadFailed);

      router.push("/playlists");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : T.loadFailed);
      setDeleting(false);
    }
  }

  async function removeVideo(videoId) {
    if (!item?.is_owner || !videoId || removingId) return;

    setRemovingId(videoId);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}/videos/${encodeURIComponent(videoId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.loadFailed);

      setItem((prev) => {
        if (!prev) return prev;
        const nextVideos = (prev.videos || []).filter((video) => String(video.id) !== String(videoId));
        setInitialOrderIds(nextVideos.map((video) => String(video.id)));
        return { ...prev, videos: nextVideos, videos_count: nextVideos.length };
      });
      window.alert(T.removeDone);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : T.loadFailed);
    } finally {
      setRemovingId("");
    }
  }

  function onDragStart(videoId) {
    setDragId(String(videoId));
  }

  function onDragOver(event, videoId) {
    event.preventDefault();
    setDragOverId(String(videoId));
  }

  function onDrop(event, videoId) {
    event.preventDefault();
    const fromId = String(dragId || "");
    const toId = String(videoId || "");
    if (!fromId || !toId || fromId === toId) {
      setDragId("");
      setDragOverId("");
      return;
    }

    setItem((prev) => {
      if (!prev) return prev;
      const nextVideos = moveItem(prev.videos || [], fromId, toId);
      return { ...prev, videos: nextVideos };
    });

    setDragId("");
    setDragOverId("");
  }

  async function saveOrder() {
    if (!item?.is_owner || !isOrderDirty || savingOrder) return;

    setSavingOrder(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ video_ids: currentOrderIds }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.loadFailed);

      setInitialOrderIds(currentOrderIds);
      window.alert(T.orderSaved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : T.loadFailed);
    } finally {
      setSavingOrder(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8 text-center text-slate-500">Loading...</div>;
  if (error && !item) return <div className="mx-auto max-w-7xl px-4 py-8 text-center text-slate-600">{error}</div>;
  if (!item) return <div className="mx-auto max-w-7xl px-4 py-8 text-center text-slate-600">{T.notFound}</div>;

  const ownerName = item?.owner?.display_name || item?.owner?.username || "-";
  const ownerUsername = item?.owner?.username || "";
  const totalViews = videos.reduce((sum, row) => sum + Number(row.views_count || 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-right">
        <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {privacyLabel(item.privacy)} - {formatCompactNumber(videos.length)} {T.videos} - {formatCompactNumber(totalViews)} {T.views}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {T.by}{" "}
          {ownerUsername ? (
            <Link href={`/channel/${ownerUsername}`} className="font-semibold text-slate-700 hover:underline">{ownerName}</Link>
          ) : (
            <span className="font-semibold text-slate-700">{ownerName}</span>
          )}
        </p>
        {item.description ? <p className="mt-3 text-sm leading-7 text-slate-700">{item.description}</p> : null}
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={copyPlaylistLink} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">{T.copyLink}</button>
          <button type="button" onClick={sharePlaylistLink} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">{T.share}</button>
        </div>
      </section>

      {item.is_owner ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-right">
          <form onSubmit={savePlaylist} className="space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="\u0627\u0633\u0645 \u0627\u0644\u0642\u0627\u0626\u0645\u0629"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-right text-sm outline-none focus:border-slate-500"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="\u0648\u0635\u0641 \u0627\u0644\u0642\u0627\u0626\u0645\u0629"
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-slate-500"
            />
            <select
              value={privacy}
              onChange={(event) => setPrivacy(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-right text-sm outline-none focus:border-slate-500"
            >
              <option value="private">{T.private}</option>
              <option value="unlisted">{T.unlisted}</option>
              <option value="public">{T.public}</option>
            </select>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? T.saving : T.save}
              </button>
              <button type="button" onClick={deletePlaylist} disabled={deleting} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60">
                {deleting ? T.deletingPlaylist : T.deletePlaylist}
              </button>
            </div>
          </form>
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        </section>
      ) : null}

      {videos.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{T.empty}</section>
      ) : (
        <>
          <VideoGrid videos={videos} mode="channel" />

          {item.is_owner ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-right">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveOrder}
                    disabled={!isOrderDirty || savingOrder}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {savingOrder ? T.savingOrder : T.saveOrder}
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{T.reorderTitle}</h3>
                  <p className="text-xs text-slate-500">{T.reorderHint}</p>
                </div>
              </div>

              <div className="space-y-2">
                {videos.map((video, index) => {
                  const isOver = dragOverId && String(dragOverId) === String(video.id);
                  return (
                    <div
                      key={video.id}
                      draggable
                      onDragStart={() => onDragStart(video.id)}
                      onDragOver={(event) => onDragOver(event, video.id)}
                      onDrop={(event) => onDrop(event, video.id)}
                      onDragEnd={() => {
                        setDragId("");
                        setDragOverId("");
                      }}
                      className={[
                        "flex cursor-grab items-center justify-between gap-3 rounded-xl border bg-slate-50 px-3 py-2 active:cursor-grabbing",
                        isOver ? "border-slate-500" : "border-slate-200",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => removeVideo(video.id)}
                        disabled={Boolean(removingId)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
                      >
                        {removingId === video.id ? "..." : T.removeVideo}
                      </button>

                      <Link href={`/watch/${video.id}`} className="min-w-0 truncate text-sm font-semibold text-slate-800 hover:underline">
                        {index + 1}. {video.title || T.untitledVideo}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
