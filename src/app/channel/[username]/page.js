import VideoGrid from "@/components/video/VideoGrid";
import ChannelSubscribeButton from "@/components/video/ChannelSubscribeButton";
import { getChannelPage } from "@/lib/video/queries";
import { formatCompactNumber } from "@/lib/video/format";

const T = {
  notFound: "القناة غير موجودة",
  fallbackBio: "قناة لنشر محتوى هادف ومفيد",
  subscribers: "مشترك",
  videos: "فيديو",
  views: "مشاهدة",
  channelVideos: "فيديوهات القناة",
  joined: "انضم",
};

function initials(name) {
  const text = String(name || "").trim();
  if (!text) return "U";
  return text.slice(0, 1).toUpperCase();
}

function formatJoinDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
  }).format(date);
}

export default async function ChannelPage({ params }) {
  const { username } = await params;
  const { channel, videos } = await getChannelPage(username);

  if (!channel) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-slate-600">{T.notFound}</div>;
  }

  const displayName = channel.display_name || channel.username;
  const bio = channel.bio || T.fallbackBio;
  const videosCount = Number(channel.videos_count || videos.length || 0);
  const subscribersCount = Number(channel.subscribers_count || 0);
  const totalViews = Number(channel.total_views || 0);
  const joinedAt = formatJoinDate(channel.created_at);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-36 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 sm:h-48 md:h-60">
          {channel.cover_url ? <img src={channel.cover_url} alt={displayName} className="h-full w-full object-cover" /> : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/25 to-transparent" />
        </div>

        <div className="relative -mt-12 px-4 pb-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 min-h-24 min-w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md sm:h-28 sm:w-28 sm:min-h-28 sm:min-w-28">
                {channel.avatar_url ? (
                  <img src={channel.avatar_url} alt={displayName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-slate-500">{initials(displayName)}</div>
                )}
              </div>

              <div className="pb-1 text-right">
                <h1 className="text-2xl font-black text-slate-900 sm:text-4xl">{displayName}</h1>
                <p className="mt-1 text-base font-semibold text-slate-600" dir="ltr">@{channel.username}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {formatCompactNumber(subscribersCount)} {T.subscribers} · {formatCompactNumber(videosCount)} {T.videos} · {formatCompactNumber(totalViews)} {T.views}
                </p>
                {joinedAt ? <p className="mt-1 text-xs text-slate-500">{T.joined} {joinedAt}</p> : null}
              </div>
            </div>

            <div className="pb-2">
              <ChannelSubscribeButton
                username={channel.username}
                channelId={channel.id}
                initialCount={subscribersCount}
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-right">
            <p className="text-sm leading-8 text-slate-700">{bio}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-right text-2xl font-black text-slate-900">{T.channelVideos}</h2>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{formatCompactNumber(videosCount)} {T.videos}</span>
        </div>
        <VideoGrid videos={videos} />
      </section>
    </div>
  );
}
