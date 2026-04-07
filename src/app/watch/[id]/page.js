import Link from "next/link";
import Image from "next/image";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoEngagementClient from "@/components/video/VideoEngagementClient";
import InteractiveText from "@/components/video/InteractiveText";
import { formatArabicDate, formatCompactNumber, formatDuration } from "@/lib/video/format";
import { getVideoById, listVideos } from "@/lib/video/queries";

const T = {
  notFound: "الفيديو غير موجود",
  views: "مشاهدة",
  noDesc: "لا يوجد وصف",
  visit: "زيارة قناة",
  related: "فيديوهات مقترحة",
  untitled: "فيديو بدون عنوان",
  noThumb: "بدون صورة",
};

export default async function WatchPage({ params }) {
  const { id } = await params;
  const { video } = await getVideoById(id);

  if (!video) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-slate-600">{T.notFound}</div>;
  }

  const { videos: related } = await listVideos({ filter: "trending", page: 1 });
  const relatedWithoutCurrent = (related || []).filter((item) => item.id !== video.id).slice(0, 12);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="order-2 space-y-3 xl:order-1 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1">
          <h2 className="text-right text-lg font-black text-slate-900">{T.related}</h2>

          <div className="space-y-3">
            {relatedWithoutCurrent.map((item) => (
              <Link
                key={item.id}
                href={`/watch/${item.id}`}
                className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-2 text-right transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-slate-200 sm:w-44">
                  {item.thumbnail_url ? (
                    <Image
                      src={item.thumbnail_url}
                      alt={item.title || T.untitled}
                      fill
                      sizes="(max-width: 640px) 160px, 176px"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
                      {T.noThumb}
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {formatDuration(item.duration_sec)}
                  </span>
                </div>

                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="line-clamp-2 text-sm font-bold leading-6 text-slate-900 group-hover:text-red-700">
                    <InteractiveText text={item.title || T.untitled} linkify={false} />
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                    {item.channel?.display_name || item.channel?.username || "-"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatCompactNumber(item.views_count)} {T.views} • {formatArabicDate(item.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        <section className="order-1 space-y-4 xl:order-2">
          <VideoPlayer src={video.video_url} poster={video.thumbnail_url} title={video.title} videoId={video.id} />

          <VideoEngagementClient
            videoId={video.id}
            channelUsername={video.channel?.username}
            likesCount={video.likes_count}
            dislikesCount={video.dislikes_count}
            userReaction={0}
            isSubscribed={false}
            subscribersCount={0}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-right">
            <h1 className="text-2xl font-black text-slate-900"><InteractiveText text={video.title} /></h1>
            <p className="mt-2 text-sm text-slate-500">
              {formatCompactNumber(video.views_count)} {T.views} • {formatArabicDate(video.created_at)}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-700"><InteractiveText text={video.description || T.noDesc} /></p>
            <Link href={`/channel/${video.channel?.username}`} className="mt-4 inline-block text-sm font-bold text-red-700">
              {T.visit} {video.channel?.display_name || video.channel?.username}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}



