function TopBarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-full bg-slate-300" />
        <span className="h-10 w-10 rounded-full bg-slate-300" />
        <span className="h-10 w-10 rounded-full bg-slate-300" />
      </div>
      <div className="h-12 w-full max-w-4xl rounded-full border border-slate-300 bg-slate-200" />
    </div>
  );
}

function VideoCardSkeleton() {
  return (
    <article className="space-y-3">
      <div className="aspect-video w-full rounded-2xl bg-slate-300" />
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-full rounded-md bg-slate-300" />
          <div className="h-4 w-3/4 rounded-md bg-slate-300" />
        </div>
        <div className="h-12 w-12 rounded-full bg-slate-300" />
      </div>
    </article>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-slate-100">
      <TopBarSkeleton />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 h-px w-full bg-slate-300" />

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))}
        </section>
      </div>
    </div>
  );
}

