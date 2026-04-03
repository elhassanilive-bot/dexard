import { formatCompactNumber, formatDuration } from "@/lib/video/format";
import Link from "next/link";

const T = {
  noThumb: "\u0628\u062f\u0648\u0646 \u0635\u0648\u0631\u0629 \u0645\u0635\u063a\u0631\u0629",
  channel: "\u0642\u0646\u0627\u0629",
  views: "\u0645\u0634\u0627\u0647\u062f\u0629",
};

export default function VideoCard({ video }) {
  const href = `/watch/${video.id}`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="block">
        <div className="relative aspect-video bg-slate-200">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white">{T.noThumb}</div>
          )}
          <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-1 text-xs font-bold text-white">{formatDuration(video.duration_sec)}</span>
        </div>

        <div className="space-y-1 p-3 text-right">
          <h3 className="line-clamp-2 text-sm font-extrabold leading-6 text-slate-900">{video.title}</h3>
          <p className="line-clamp-1 text-xs text-slate-600">{video.channel?.display_name || video.channel?.username || T.channel}</p>
          <p className="text-xs text-slate-500">{formatCompactNumber(video.views_count)} {T.views}</p>
        </div>
      </Link>
    </article>
  );
}