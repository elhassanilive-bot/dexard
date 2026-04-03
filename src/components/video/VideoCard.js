import { formatCompactNumber, formatDuration } from "@/lib/video/format";
import Link from "next/link";

const T = {
  noThumb: "\u0628\u062f\u0648\u0646 \u0635\u0648\u0631\u0629 \u0645\u0635\u063a\u0631\u0629",
  channel: "\u0642\u0646\u0627\u0629",
  views: "\u0645\u0634\u0627\u0647\u062f\u0629",
  untitled: "\u0641\u064a\u062f\u064a\u0648 \u0628\u062f\u0648\u0646 \u0639\u0646\u0648\u0627\u0646",
  menu: "\u062e\u064a\u0627\u0631\u0627\u062a",
};

function truncateText(value, max = 24) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function formatRelativeTimeCompact(value) {
  if (!value) return "\u0627\u0644\u0622\u0646";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u0627\u0644\u0622\u0646";

  const diffSeconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}\u062b`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}\u062f`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}\u0633`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}\u064a`;
  if (diffSeconds < 31536000) return `${Math.floor(diffSeconds / 2592000)}\u0634`;
  return `${Math.floor(diffSeconds / 31536000)}\u0633\u0646`;
}

export default function VideoCard({ video }) {
  const href = `/watch/${video.id}`;
  const displayName = video.channel?.display_name || video.channel?.username || T.channel;
  const compactName = truncateText(displayName, 13);
  const avatarUrl = video.channel?.avatar_url || "";
  const timeAgo = formatRelativeTimeCompact(video.created_at);
  const compactTitle = truncateText(video.title || T.untitled, 34);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <Link href={href} className="block overflow-hidden">
        <div className="relative aspect-[16/11] bg-slate-200">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white">{T.noThumb}</div>
          )}

          <div className="absolute right-2 top-2">
            <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-1.5 py-1 backdrop-blur-md">
              <div className="text-right leading-tight text-white">
                <p className="max-w-[72px] truncate text-[11px] font-semibold">{compactName}</p>
                <p className="text-[9px] text-white/85">{timeAgo}</p>
              </div>
              <span className="h-7 w-7 overflow-hidden rounded-full border border-white/20 bg-slate-800">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
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
          <h3 className="truncate text-right text-base font-semibold leading-[1.35] text-slate-900 md:text-lg" title={video.title || T.untitled}>
            {compactTitle}
          </h3>
        </Link>
        <button
          type="button"
          aria-label={T.menu}
          title={T.menu}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>
      </div>
    </article>
  );
}
