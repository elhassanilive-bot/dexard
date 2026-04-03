export default function BlogPostLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
          <div className="h-4 w-40 rounded-full bg-orange-100" />
          <div className="mt-6 h-14 w-3/4 rounded-3xl bg-slate-100" />
          <div className="mt-4 h-6 w-1/2 rounded-2xl bg-slate-100" />
          <div className="mt-8 flex gap-3">
            <div className="h-10 w-20 rounded-full bg-slate-100" />
            <div className="h-10 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="h-[26rem] rounded-[2rem] bg-slate-100" />
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-5 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
