"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BlogImage from "@/components/blog/BlogImage";
import { estimateReadingTime, formatArabicDate } from "@/lib/blog/render";

function SmallPostCard({ post }) {
  return (
    <article className="border border-slate-200 bg-white transition hover:border-red-200">
      <Link href={`/blog/${post.slug}`} className="grid grid-cols-[96px_1fr] gap-3 p-3">
        <div className="relative h-24 overflow-hidden bg-slate-200">
          <BlogImage
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes="96px"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[10px] font-extrabold text-red-700">{post.category || "مقال"}</div>
          <h3 className="mt-1 line-clamp-2 text-sm font-black leading-6 text-slate-950">{post.title}</h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{post.excerpt}</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-slate-400">
            <span>{formatArabicDate(post.publishedAt || post.createdAt)}</span>
            <span>{estimateReadingTime(post.content)} دقائق</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function HomeTabsPanel({ posts = [], featuredPosts = [] }) {
  const tabs = useMemo(() => {
    const uniqueBySlug = (items) =>
      items.filter(Boolean).filter((item, index, array) => array.findIndex((entry) => entry.slug === item.slug) === index);

    const latest = uniqueBySlug(
      [...posts].sort(
        (a, b) => new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime()
      )
    ).slice(0, 6);

    const mostRead = uniqueBySlug(
      [...posts].sort(
        (a, b) => estimateReadingTime(b.content) - estimateReadingTime(a.content) || String(b.excerpt || "").length - String(a.excerpt || "").length
      )
    ).slice(0, 6);

    const editorPicks = uniqueBySlug([...featuredPosts, ...posts]).slice(0, 6);

    const recommended = uniqueBySlug(
      [...posts].sort((a, b) => {
        const scoreA = (a.coverImageUrl ? 2 : 0) + (a.tags?.length || 0) + estimateReadingTime(a.content);
        const scoreB = (b.coverImageUrl ? 2 : 0) + (b.tags?.length || 0) + estimateReadingTime(b.content);
        return scoreB - scoreA;
      })
    ).slice(0, 6);

    return [
      { id: "most-read", label: "الأكثر قراءة", posts: mostRead },
      { id: "editor-picks", label: "مختارات المحرر", posts: editorPicks },
      { id: "latest", label: "آخر المقالات", posts: latest },
      { id: "recommended", label: "موصى به", posts: recommended },
    ];
  }, [featuredPosts, posts]);

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "most-read");
  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  if (!currentTab?.posts?.length) return null;

  return (
    <section className="border border-slate-200 bg-white px-4 py-5 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "rounded-full border px-4 py-2 text-sm font-bold transition",
                currentTab.id === tab.id
                  ? "border-red-700 bg-red-700 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-red-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="h-7 w-1 bg-red-700" />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {currentTab.posts.map((post) => (
          <SmallPostCard key={`${currentTab.id}-${post.slug}`} post={post} />
        ))}
      </div>
    </section>
  );
}
