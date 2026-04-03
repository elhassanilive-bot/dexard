import VideoCard from "@/components/video/VideoCard";

const T = {
  empty: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0645\u062a\u0627\u062d\u0629 \u062d\u0627\u0644\u064a\u064b\u0627",
};

export default function VideoGrid({ videos }) {
  if (!videos?.length) {
    return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{T.empty}</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}