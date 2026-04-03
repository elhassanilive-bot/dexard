import Link from "next/link";
import VideoGrid from "@/components/video/VideoGrid";
import { FEED_FILTERS, FEED_PAGE_SIZE } from "@/lib/video/constants";
import { listVideos } from "@/lib/video/queries";

const T = {
  title: "\u0645\u0646\u0635\u0629 \u062f\u0643\u0632\u0627\u0631\u062f \u0644\u0644\u0641\u064a\u062f\u064a\u0648",
  subtitle: "\u0627\u0643\u062a\u0634\u0641 \u0648\u0634\u0627\u0647\u062f \u0648\u0627\u0646\u0634\u0631 \u0645\u062d\u062a\u0648\u0649 \u0623\u062e\u0644\u0627\u0642\u064a \u0628\u062c\u0648\u062f\u0629 \u0639\u0627\u0644\u064a\u0629",
  previous: "\u0627\u0644\u0633\u0627\u0628\u0642",
  next: "\u0627\u0644\u062a\u0627\u0644\u064a",
  page: "\u0635\u0641\u062d\u0629",
  of: "\u0645\u0646",
};

function FilterTab({ href, active, children }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-2 text-sm font-extrabold transition",
        active ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export default async function HomePage({ searchParams }) {
  const resolved = await searchParams;
  const filter = String(resolved?.filter || "latest");
  const q = String(resolved?.q || "");
  const category = String(resolved?.category || "");
  const channel = String(resolved?.channel || "");
  const page = Math.max(1, Number.parseInt(String(resolved?.page || "1"), 10));

  const { videos, total } = await listVideos({ filter, q, category, channel, page });
  const totalPages = Math.max(1, Math.ceil((total || 0) / FEED_PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-red-700 via-red-600 to-slate-900 p-7 text-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
        <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative text-right">
          <h1 className="text-3xl font-black sm:text-4xl">{T.title}</h1>
          <p className="mt-2 text-sm text-white/90 sm:text-base">{T.subtitle}</p>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {FEED_FILTERS.map((item) => {
          const href = `/?filter=${item.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
          return (
            <FilterTab key={item.key} href={href} active={item.key === filter}>
              {item.label}
            </FilterTab>
          );
        })}
      </section>

      <VideoGrid videos={videos} />

      <section className="flex items-center justify-center gap-2 py-4">
        <Link
          href={`/?filter=${filter}&q=${encodeURIComponent(q)}&page=${Math.max(1, page - 1)}`}
          className={[
            "rounded-full px-4 py-2 text-sm font-bold",
            page <= 1 ? "pointer-events-none bg-slate-200 text-slate-500" : "border border-slate-300 bg-white text-slate-700",
          ].join(" ")}
        >
          {T.previous}
        </Link>
        <span className="text-sm text-slate-600">{T.page} {page} {T.of} {totalPages}</span>
        <Link
          href={`/?filter=${filter}&q=${encodeURIComponent(q)}&page=${Math.min(totalPages, page + 1)}`}
          className={[
            "rounded-full px-4 py-2 text-sm font-bold",
            page >= totalPages ? "pointer-events-none bg-slate-200 text-slate-500" : "border border-slate-300 bg-white text-slate-700",
          ].join(" ")}
        >
          {T.next}
        </Link>
      </section>
    </div>
  );
}