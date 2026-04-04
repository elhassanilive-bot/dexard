import VideoCard from "@/components/video/VideoCard";

const T = {
  empty: "لا توجد فيديوهات متاحة حاليًا",
};

export default function VideoGrid({ videos, mode = "home" }) {
  if (!videos?.length) {
    return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{T.empty}</div>;
  }

  const gridClass = mode === "library"
    ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    : mode === "channel"
      ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={gridClass}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} mode={mode === "library" ? "library" : "home"} />
      ))}
    </div>
  );
}
