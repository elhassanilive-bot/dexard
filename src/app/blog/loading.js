export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-8">
        <div className="h-14 w-2/3 rounded-3xl bg-orange-100" />
        <div className="h-6 w-1/2 rounded-2xl bg-slate-100" />
        <div className="grid gap-8 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
              <div className="h-60 bg-slate-100" />
              <div className="space-y-4 p-6">
                <div className="h-4 w-32 rounded-full bg-orange-100" />
                <div className="h-8 w-full rounded-2xl bg-slate-100" />
                <div className="h-5 w-full rounded-2xl bg-slate-100" />
                <div className="h-5 w-4/5 rounded-2xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
