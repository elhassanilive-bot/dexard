import VideoGrid from "@/components/video/VideoGrid";
import { getChannelPage } from "@/lib/video/queries";
import { formatCompactNumber } from "@/lib/video/format";

const T = {
  notFound: "\u0627\u0644\u0642\u0646\u0627\u0629 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629",
  fallbackBio: "\u0642\u0646\u0627\u0629 \u0644\u0646\u0634\u0631 \u0645\u062d\u062a\u0648\u0649 \u0623\u062e\u0644\u0627\u0642\u064a",
  subscribers: "\u0645\u0634\u062a\u0631\u0643",
  channelVideos: "\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0627\u0644\u0642\u0646\u0627\u0629",
};

export default async function ChannelPage({ params }) {
  const { username } = await params;
  const { channel, videos } = await getChannelPage(username);

  if (!channel) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-slate-600">{T.notFound}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-right">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{channel.display_name || channel.username}</h1>
            <p className="text-sm text-slate-500">@{channel.username}</p>
            <p className="mt-2 text-sm text-slate-700">{channel.bio || T.fallbackBio}</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">{formatCompactNumber(channel.subscribers_count)} {T.subscribers}</div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-right text-xl font-black text-slate-900">{T.channelVideos}</h2>
        <VideoGrid videos={videos} />
      </section>
    </div>
  );
}