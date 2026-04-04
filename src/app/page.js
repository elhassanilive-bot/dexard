import Link from "next/link";
import InfiniteVideoFeed from "@/components/video/InfiniteVideoFeed";
import { FEED_FILTERS } from "@/lib/video/constants";
import { listVideos } from "@/lib/video/queries";

function FilterTab({ href, active, children }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-2.5 py-1 text-[11px] font-normal transition",
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-wrap items-center gap-1.5">
        {FEED_FILTERS.map((item) => {
          const href = `/?filter=${item.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
          return (
            <FilterTab key={item.key} href={href} active={item.key === filter}>
              {item.label}
            </FilterTab>
          );
        })}
      </section>

      <InfiniteVideoFeed
        initialVideos={videos}
        initialPage={page}
        total={total}
        q={q}
        filter={filter}
        category={category}
        channel={channel}
      />
    </div>
  );
}

