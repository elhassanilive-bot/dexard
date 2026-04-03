import Link from "next/link";
import VideoGrid from "@/components/video/VideoGrid";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoEngagementClient from "@/components/video/VideoEngagementClient";
import { formatArabicDate, formatCompactNumber } from "@/lib/video/format";
import { getVideoById, listVideos } from "@/lib/video/queries";

const T = {
  notFound: "\u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f",
  views: "\u0645\u0634\u0627\u0647\u062f\u0629",
  noDesc: "\u0644\u0627 \u064a\u0648\u062c\u062f \u0648\u0635\u0641",
  visit: "\u0632\u064a\u0627\u0631\u0629 \u0627\u0644\u0642\u0646\u0627\u0629",
  related: "\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0645\u0642\u062a\u0631\u062d\u0629",
};

export default async function WatchPage({ params }) {
  const { id } = await params;
  const { video } = await getVideoById(id);

  if (!video) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-slate-600">{T.notFound}</div>;
  }

  const { videos: related } = await listVideos({ filter: "trending", page: 1 });
  const relatedWithoutCurrent = related.filter((item) => item.id !== video.id).slice(0, 8);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
      <section className="space-y-4">
        <VideoPlayer src={video.video_url} poster={video.thumbnail_url} title={video.title} videoId={video.id} />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-right">
          <h1 className="text-2xl font-black text-slate-900">{video.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{formatCompactNumber(video.views_count)} {T.views} • {formatArabicDate(video.created_at)}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-700">{video.description || T.noDesc}</p>
          <Link href={`/channel/${video.channel?.username}`} className="mt-4 inline-block text-sm font-bold text-red-700">{T.visit} {video.channel?.display_name || video.channel?.username}</Link>
        </div>

        <VideoEngagementClient videoId={video.id} channelUsername={video.channel?.username} likesCount={video.likes_count} dislikesCount={video.dislikes_count} userReaction={0} isSubscribed={false} subscribersCount={0} />
      </section>

      <aside className="space-y-3">
        <h2 className="text-right text-lg font-black text-slate-900">{T.related}</h2>
        <VideoGrid videos={relatedWithoutCurrent} />
      </aside>
    </div>
  );
}