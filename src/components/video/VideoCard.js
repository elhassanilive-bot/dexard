"use client";

import { useEffect, useRef, useState } from "react";
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
};

function truncateText(value, max = 24) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

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

function PinMenuButton({ canPin, pinned, pending, onToggle }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
      }
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

      {open && canPin ? (
        <div className="absolute left-0 top-10 z-30 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 text-right shadow-xl">
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              await onToggle();
              setOpen(false);
            }}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            <span className="text-right">
              <span className="block font-semibold">{pinned ? T.unpin : T.pin}</span>
              <span className="block text-[11px] text-slate-500">{T.pinHint}</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-slate-800">
              {pinned ? (
                <path d="M6.75 3h10.5a.75.75 0 0 1 .75.75v16.5a.75.75 0 0 1-1.06.68L12 18.47l-4.94 2.46A.75.75 0 0 1 6 20.25V3.75A.75.75 0 0 1 6.75 3Z" />
              ) : (
                <path d="M17.25 3A2.25 2.25 0 0 1 19.5 5.25v15a.75.75 0 0 1-1.09.67L12 17.72l-6.41 3.2A.75.75 0 0 1 4.5 20.25v-15A2.25 2.25 0 0 1 6.75 3h10.5Zm.75 2.25a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v13.79l5.66-2.83a.75.75 0 0 1 .68 0L18 19.04V5.25Z" />
              )}
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function HomeLikeCard({ video, title, displayName, compactName, avatarUrl, timeAgo, href, pinned, canPin, pending, onTogglePin }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
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
        <PinMenuButton canPin={canPin} pinned={pinned} pending={pending} onToggle={onTogglePin} />
      </div>
    </article>
  );
}

function LibraryCard({ video, title, displayName, href, pinned, canPin, pending, onTogglePin }) {
  const contextLine = getContextLine(video);
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
              <PinMenuButton canPin={canPin} pinned={pinned} pending={pending} onToggle={onTogglePin} />
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

export default function VideoCard({ video, mode = "home", allowPin = false, onPinChanged }) {
  const href = `/watch/${video.id}`;
  const displayName = video.channel?.display_name || video.channel?.username || T.channel;
  const compactName = truncateText(displayName, 16);
  const avatarUrl = video.channel?.avatar_url || "";
  const timeAgo = formatRelativeTimeCompact(video.created_at);
  const title = video.title || T.untitled;

  const [pinned, setPinned] = useState(Boolean(video?.is_pinned));
  const [pendingPin, setPendingPin] = useState(false);

  async function togglePin() {
    if (!allowPin || pendingPin) return;
    setPendingPin(true);
    const previous = pinned;
    setPinned(!previous);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error("no_supabase");
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token || "";
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
      setPendingPin(false);
    }
  }

  if (mode === "library") {
    return <LibraryCard video={video} title={title} displayName={displayName} href={href} pinned={pinned} canPin={allowPin} pending={pendingPin} onTogglePin={togglePin} />;
  }

  return <HomeLikeCard video={video} title={title} displayName={displayName} compactName={compactName} avatarUrl={avatarUrl} timeAgo={timeAgo} href={href} pinned={pinned} canPin={allowPin} pending={pendingPin} onTogglePin={togglePin} />;
}
