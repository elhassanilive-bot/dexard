"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatArabicDate, formatCompactNumber, formatDuration } from "@/lib/video/format";
import { getSupabaseClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

const T = {
  noThumb: "بدون صورة مصغرة",
  channel: "قناة",
  views: "مشاهدة",
  untitled: "فيديو بدون عنوان",
  menu: "خيارات",
  savedAt: "تم الحفظ",
  watchedAt: "آخر مشاهدة",
  reactedAt: "آخر تفاعل",
  pin: "تثبيت الفيديو",
  unpin: "إلغاء تثبيت الفيديو",
  pinHint: "يظهر في مقدمة القناة",
  pinFailed: "تعذر تحديث حالة التثبيت",
  save: "حفظ الفيديو",
  unsave: "إزالة من المحفوظات",
  addToPlaylist: "إضافة إلى قائمة تشغيل",
  createPlaylist: "إنشاء قائمة تشغيل جديدة",
  choosePlaylist: "اختر رقم قائمة التشغيل",
  invalidPlaylistChoice: "اختيار غير صالح",
  addedToPlaylist: "تمت الإضافة إلى القائمة",
  removedFromPlaylist: "تمت الإزالة من القائمة",
  share: "مشاركة",
  copyLink: "نسخ الرابط",
  notInterested: "غير مهتم",
  report: "إبلاغ",
  block: "حظر القناة",
  unblock: "إلغاء حظر القناة",
  edit: "تعديل الفيديو",
  delete: "حذف الفيديو",
  deleteConfirm: "هل تريد حذف هذا الفيديو نهائيا؟",
  reportPrompt: "سبب الإبلاغ (spam / violence / hate / harassment / sexual / copyright / misleading / other)",
  reportDone: "تم إرسال البلاغ",
  loginRequired: "يجب تسجيل الدخول أولا",
  actionFailed: "تعذر تنفيذ العملية",
};

function formatRelativeTimeCompact(value) {
  if (!value) return "الآن";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "الآن";

  const diffSeconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}ث`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}د`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}س`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}ي`;
  if (diffSeconds < 31536000) return `${Math.floor(diffSeconds / 2592000)}ش`;
  return `${Math.floor(diffSeconds / 31536000)}سن`;
}

function getContextLine(video) {
  if (video?.saved_at) return `${T.savedAt}: ${formatArabicDate(video.saved_at)}`;
  if (video?.watched_at) return `${T.watchedAt}: ${formatArabicDate(video.watched_at)}`;
  if (video?.reacted_at) return `${T.reactedAt}: ${formatArabicDate(video.reacted_at)}`;
  return "";
}

function MenuItem({ label, hint = "", onClick, icon, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition disabled:opacity-60",
        danger ? "text-rose-700 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      <span className="text-right">
        <span className="block font-semibold">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] text-slate-500">{hint}</span> : null}
      </span>
      {icon}
    </button>
  );
}

function VideoMenu({
  isOwner,
  canPin,
  pinned,
  pending,
  saved,
  blocked,
  onPin,
  onSave,
  onAddToPlaylist,
  onShare,
  onCopy,
  onHide,
  onReport,
  onBlock,
  onEdit,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-label={T.menu}
        title={T.menu}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 bottom-full mb-2 z-30 min-w-56 rounded-xl border border-slate-200 bg-white p-1.5 text-right shadow-xl">
          {isOwner ? (
            <>
              {canPin ? (
                <MenuItem
                  label={pinned ? T.unpin : T.pin}
                  hint={T.pinHint}
                  disabled={pending}
                  onClick={async () => {
                    await onPin();
                    setOpen(false);
                  }}
                  icon={<span className="text-xs">📌</span>}
                />
              ) : null}
              <MenuItem
                label={T.addToPlaylist}
                disabled={pending}
                onClick={async () => {
                  await onAddToPlaylist();
                  setOpen(false);
                }}
                icon={<span className="text-xs">📂</span>}
              />
              <MenuItem
                label={T.edit}
                disabled={pending}
                onClick={async () => {
                  await onEdit();
                  setOpen(false);
                }}
                icon={<span className="text-xs">✏️</span>}
              />
              <MenuItem
                label={T.delete}
                danger
                disabled={pending}
                onClick={async () => {
                  await onDelete();
                  setOpen(false);
                }}
                icon={<span className="text-xs">🗑️</span>}
              />

              <MenuItem
                label={T.share}
                disabled={pending}
                onClick={async () => {
                  await onShare();
                  setOpen(false);
                }}
                icon={<span className="text-xs">↗</span>}
              />
              <MenuItem
                label={T.copyLink}
                disabled={pending}
                onClick={async () => {
                  await onCopy();
                  setOpen(false);
                }}
                icon={<span className="text-xs">🔗</span>}
              />
            </>
          ) : (
            <>
              <MenuItem
                label={saved ? T.unsave : T.save}
                disabled={pending}
                onClick={async () => {
                  await onSave();
                  setOpen(false);
                }}
                icon={<span className="text-xs">💾</span>}
              />
              <MenuItem
                label={T.addToPlaylist}
                disabled={pending}
                onClick={async () => {
                  await onAddToPlaylist();
                  setOpen(false);
                }}
                icon={<span className="text-xs">📂</span>}
              />
              <MenuItem
                label={T.share}
                disabled={pending}
                onClick={async () => {
                  await onShare();
                  setOpen(false);
                }}
                icon={<span className="text-xs">↗</span>}
              />
              <MenuItem
                label={T.copyLink}
                disabled={pending}
                onClick={async () => {
                  await onCopy();
                  setOpen(false);
                }}
                icon={<span className="text-xs">🔗</span>}
              />
              <MenuItem
                label={T.notInterested}
                disabled={pending}
                onClick={async () => {
                  await onHide();
                  setOpen(false);
                }}
                icon={<span className="text-xs">🙈</span>}
              />
              <MenuItem
                label={T.report}
                danger
                disabled={pending}
                onClick={async () => {
                  await onReport();
                  setOpen(false);
                }}
                icon={<span className="text-xs">🚩</span>}
              />
              <MenuItem
                label={blocked ? T.unblock : T.block}
                danger
                disabled={pending}
                onClick={async () => {
                  await onBlock();
                  setOpen(false);
                }}
                icon={<span className="text-xs">⛔</span>}
              />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function HomeLikeCard({ video, title, displayName, compactName, avatarUrl, timeAgo, href, pinned, menu }) {
  return (
    <article className="group rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="block overflow-hidden">
        <div className="relative aspect-video bg-slate-200">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white">{T.noThumb}</div>
          )}

          {pinned ? <span className="absolute left-2 top-2 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-semibold text-white">مثبّت</span> : null}

          <div className="absolute right-2 top-2">
            <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-1.5 py-1 backdrop-blur-md">
              <div className="text-right leading-tight text-white">
                <p className="max-w-[92px] truncate text-[11px] font-semibold">{compactName}</p>
                <p className="text-[9px] text-white/85">{timeAgo}</p>
              </div>
              <span className="h-7 w-7 overflow-hidden rounded-full border border-white/20 bg-slate-800">
                {avatarUrl ? (
                  <span className="relative block h-full w-full">
                    <Image src={avatarUrl} alt={displayName} fill sizes="28px" className="object-cover" />
                  </span>
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">{displayName.slice(0, 1)}</span>
                )}
              </span>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-between px-2.5">
            <span className="rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white">{formatCompactNumber(video.views_count)} {T.views}</span>
            <span className="rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white">{formatDuration(video.duration_sec)}</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 p-3">
        <Link href={href} className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-right text-base font-semibold leading-[1.35] text-slate-900 md:text-lg" title={title}>
            {title}
          </h3>
        </Link>
        {menu}
      </div>
    </article>
  );
}

function LibraryCard({ video, title, displayName, href, pinned, menu }) {
  const contextLine = getContextLine(video);
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow">
      <div className="flex flex-col sm:flex-row">
        <Link href={href} className="block sm:w-[44%] md:w-[46%]">
          <div className="relative aspect-video bg-slate-200">
            {video.thumbnail_url ? (
              <Image
                src={video.thumbnail_url}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 46vw, 30vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white">{T.noThumb}</div>
            )}
            <span className="absolute bottom-2 left-2 rounded-lg bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-white">{formatDuration(video.duration_sec)}</span>
            {pinned ? <span className="absolute left-2 top-2 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-semibold text-white">مثبّت</span> : null}
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
          <div className="space-y-2 text-right">
            <div className="flex items-start justify-between gap-2">
              {menu}
              <Link href={href} className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-base font-extrabold leading-6 text-slate-900" title={title}>{title}</h3>
              </Link>
            </div>
            <p className="truncate text-sm font-semibold text-slate-600">{displayName}</p>
            <p className="text-xs text-slate-500">{formatCompactNumber(video.views_count)} {T.views}</p>
          </div>

          {contextLine ? (
            <div className="mt-3 self-start rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {contextLine}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

async function getAccessToken() {
  const supabase = await getSupabaseClient();
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || "";
}

export default function VideoCard({ video, mode = "home", allowPin = false, isOwner = false, onPinChanged }) {
  const href = `/watch/${video.id}`;
  const title = video.title || T.untitled;
  const displayName = video.channel?.display_name || video.channel?.username || T.channel;
  const compactName = String(displayName || "").trim().length > 16 ? `${String(displayName || "").trim().slice(0, 16)}...` : String(displayName || "").trim();
  const avatarUrl = video.channel?.avatar_url || "";
  const timeAgo = formatRelativeTimeCompact(video.created_at);
  const channelUsername = video.channel?.username || "";

  const [pinned, setPinned] = useState(Boolean(video?.is_pinned));
  const [saved, setSaved] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [pending, setPending] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadStatuses() {
      if (isOwner) return;
      const token = await getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [saveRes, blockRes] = await Promise.all([
        fetch(`/api/videos/${video.id}/save`, { headers }).catch(() => null),
        channelUsername ? fetch(`/api/channels/${encodeURIComponent(channelUsername)}/block`, { headers }).catch(() => null) : Promise.resolve(null),
      ]);

      if (!alive) return;
      if (saveRes?.ok) {
        const payload = await saveRes.json().catch(() => ({}));
        if (alive) setSaved(Boolean(payload?.saved));
      }
      if (blockRes?.ok) {
        const payload = await blockRes.json().catch(() => ({}));
        if (alive) setBlocked(Boolean(payload?.blocked));
      }
    }

    loadStatuses();
    return () => {
      alive = false;
    };
  }, [video.id, channelUsername, isOwner]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/watch/${video.id}`;
  }, [video.id]);

  async function requireToken() {
    const token = await getAccessToken();
    if (!token) {
      window.alert(T.loginRequired);
      return "";
    }
    return token;
  }

  async function togglePin() {
    if (!allowPin || pending) return;
    setPending(true);
    const previous = pinned;
    setPinned(!previous);
    try {
      const token = await requireToken();
      if (!token) throw new Error("no_auth");
      const response = await fetch(`/api/videos/${video.id}/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pinned: !previous }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.pinFailed);
      setPinned(Boolean(payload?.pinned));
      if (typeof onPinChanged === "function") onPinChanged(Boolean(payload?.pinned));
    } catch {
      setPinned(previous);
      window.alert(T.pinFailed);
    } finally {
      setPending(false);
    }
  }

  async function toggleSave() {
    const token = await requireToken();
    if (!token || pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/videos/${video.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.actionFailed);
      setSaved(Boolean(payload?.saved));
    } catch {
      window.alert(T.actionFailed);
    } finally {
      setPending(false);
    }
  }

  async function addToPlaylist() {
    const token = await requireToken();
    if (!token || pending) return;

    setPending(true);
    try {
      const listResponse = await fetch(`/api/me/playlists?video_id=${encodeURIComponent(video.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listPayload = await listResponse.json().catch(() => ({}));
      if (!listResponse.ok) throw new Error(listPayload?.error || T.actionFailed);

      const items = Array.isArray(listPayload?.items) ? listPayload.items : [];

      let body = null;
      if (items.length > 0) {
        const lines = items.map((item, index) => `${index + 1}) ${item.title}${item.contains_video ? " (مضاف)" : ""}`);
        const rawChoice = window.prompt(`${T.choosePlaylist}:\n${lines.join("\n")}\n0) ${T.createPlaylist}`, "1");
        if (rawChoice === null) return;

        const choice = Number.parseInt(String(rawChoice).trim(), 10);
        if (!Number.isFinite(choice) || choice < 0 || choice > items.length) {
          window.alert(T.invalidPlaylistChoice);
          return;
        }

        if (choice === 0) {
          const newTitle = String(window.prompt(T.createPlaylist, "المفضلة") || "").trim();
          if (!newTitle) return;
          body = { title: newTitle };
        } else {
          body = { playlist_id: items[choice - 1].id };
        }
      } else {
        const newTitle = String(window.prompt(T.createPlaylist, "المفضلة") || "").trim();
        if (!newTitle) return;
        body = { title: newTitle };
      }

      const response = await fetch(`/api/videos/${video.id}/playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.actionFailed);

      const titleSuffix = payload?.playlist_title ? `: ${payload.playlist_title}` : "";
      window.alert(`${payload?.added ? T.addedToPlaylist : T.removedFromPlaylist}${titleSuffix}`);
    } catch {
      window.alert(T.actionFailed);
    } finally {
      setPending(false);
    }
  }

  async function shareVideo() {
    const url = shareUrl || `${location.origin}/watch/${video.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore cancel/share errors
    }
  }

  async function copyLink() {
    try {
      const url = shareUrl || `${location.origin}/watch/${video.id}`;
      await navigator.clipboard.writeText(url);
    } catch {
      window.alert(T.actionFailed);
    }
  }

  async function hideVideo() {
    const token = await requireToken();
    if (!token || pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/videos/${video.id}/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.actionFailed);
      if (payload?.hidden) setRemoved(true);
    } catch {
      window.alert(T.actionFailed);
    } finally {
      setPending(false);
    }
  }

  async function reportVideo() {
    const token = await requireToken();
    if (!token || pending) return;
    const reason = String(window.prompt(T.reportPrompt, "other") || "").trim().toLowerCase();
    if (!reason) return;

    setPending(true);
    try {
      const response = await fetch(`/api/videos/${video.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.actionFailed);
      window.alert(T.reportDone);
    } catch {
      window.alert(T.actionFailed);
    } finally {
      setPending(false);
    }
  }

  async function toggleBlockChannel() {
    if (!channelUsername) return;
    const token = await requireToken();
    if (!token || pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/channels/${encodeURIComponent(channelUsername)}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.actionFailed);
      const nextBlocked = Boolean(payload?.blocked);
      setBlocked(nextBlocked);
      if (nextBlocked) setRemoved(true);
    } catch {
      window.alert(T.actionFailed);
    } finally {
      setPending(false);
    }
  }

  async function editVideo() {
    const token = await requireToken();
    if (!token || pending) return;

    const nextTitle = String(window.prompt("العنوان الجديد", title) || "").trim();
    if (!nextTitle) return;
    const nextDescription = String(window.prompt("الوصف الجديد", video.description || "") || "").trim();

    setPending(true);
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: nextTitle, description: nextDescription, keywords: video.keywords || [], category: video.category || "general" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.actionFailed);
      location.reload();
    } catch {
      window.alert(T.actionFailed);
    } finally {
      setPending(false);
    }
  }

  async function deleteVideo() {
    const token = await requireToken();
    if (!token || pending) return;
    if (!window.confirm(T.deleteConfirm)) return;

    setPending(true);
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.actionFailed);
      setRemoved(true);
    } catch {
      window.alert(T.actionFailed);
    } finally {
      setPending(false);
    }
  }

  if (removed) return null;

  const menu = (
    <VideoMenu
      isOwner={isOwner}
      canPin={allowPin}
      pinned={pinned}
      pending={pending}
      saved={saved}
      blocked={blocked}
      onPin={togglePin}
      onSave={toggleSave}
      onAddToPlaylist={addToPlaylist}
      onShare={shareVideo}
      onCopy={copyLink}
      onHide={hideVideo}
      onReport={reportVideo}
      onBlock={toggleBlockChannel}
      onEdit={editVideo}
      onDelete={deleteVideo}
    />
  );

  if (mode === "library") {
    return <LibraryCard video={video} title={title} displayName={displayName} href={href} pinned={pinned} menu={menu} />;
  }

  return <HomeLikeCard video={video} title={title} displayName={displayName} compactName={compactName} avatarUrl={avatarUrl} timeAgo={timeAgo} href={href} pinned={pinned} menu={menu} />;
}










