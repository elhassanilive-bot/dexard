export default function AdminBlogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-8">
        <div className="rounded-[2rem] bg-orange-100 p-10">
          <div className="h-12 w-2/3 rounded-3xl bg-white/70" />
          <div className="mt-4 h-6 w-1/2 rounded-2xl bg-white/70" />
        </div>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_340px]">
          <div className="rounded-[2rem] bg-white p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-14 rounded-2xl bg-slate-100" />
              <div className="h-14 rounded-2xl bg-slate-100" />
            </div>
            <div className="mt-6 h-32 rounded-2xl bg-slate-100" />
            <div className="mt-6 h-[28rem] rounded-[2rem] bg-slate-100" />
          </div>
          <div className="space-y-6">
            <div className="h-56 rounded-[2rem] bg-white" />
            <div className="h-64 rounded-[2rem] bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
