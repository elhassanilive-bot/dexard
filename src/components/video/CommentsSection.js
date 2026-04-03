"use client";

import { useCallback, useEffect, useState } from "react";
import { formatArabicDate } from "@/lib/video/format";

const T = {
  user: "مستخدم",
  title: "التعليقات",
  bodyPlaceholder: "اكتب تعليقك هنا",
  parentPlaceholder: "معرّف تعليق للرد (اختياري)",
  post: "نشر التعليق",
  needAuth: "سجّل الدخول لإضافة تعليق",
  empty: "لا توجد تعليقات بعد",
  newest: "الأحدث",
  oldest: "الأقدم",
  top: "الأكثر تفاعلًا",
};

const SORTS = [
  { key: "latest", label: T.newest },
  { key: "oldest", label: T.oldest },
  { key: "top", label: T.top },
];

function SortIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M3.75 6h3.75m3 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 12h.75m-16.5 0h9.75m0 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM10.5 18h9.75m-16.5 0h3.75m3 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function CommentItem({ item }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 text-right">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-slate-900">{item.profile?.display_name || item.profile?.username || T.user}</h4>
        <span className="text-xs text-slate-500">{formatArabicDate(item.created_at)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.body}</p>
      {item.replies?.length ? <div className="mt-3 space-y-2 border-r border-slate-200 pr-3">{item.replies.map((reply) => <CommentItem key={reply.id} item={reply} />)}</div> : null}
    </article>
  );
}

export default function CommentsSection({ videoId, accessToken }) {
  const [items, setItems] = useState([]);
  const [body, setBody] = useState("");
  const [parentId, setParentId] = useState("");
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(
    async (activeSort = sort) => {
      const response = await fetch(`/api/videos/${videoId}/comments?sort=${encodeURIComponent(activeSort)}`);
      if (!response.ok) return;
      const payload = await response.json();
      setItems(payload.items || []);
    },
    [videoId, sort]
  );

  useEffect(() => {
    loadComments(sort);
  }, [loadComments, sort]);

  async function submitComment(event) {
    event.preventDefault();
    if (!accessToken || !body.trim() || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: body.trim(), parent_id: parentId || null }),
      });
      if (!response.ok) return;
      setBody("");
      setParentId("");
      await loadComments(sort);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1">
          <SortIcon />
          <div className="flex items-center gap-1">
            {SORTS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSort(option.key)}
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-medium transition",
                  sort === option.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <h2 className="text-lg font-black text-slate-900">{T.title}</h2>
      </div>

      <form onSubmit={submitComment} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={T.bodyPlaceholder} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-300" />
        <input value={parentId} onChange={(event) => setParentId(event.target.value)} placeholder={T.parentPlaceholder} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-300" />
        <button type="submit" disabled={!accessToken || loading} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{T.post}</button>
        {!accessToken ? <p className="text-xs text-slate-500">{T.needAuth}</p> : null}
      </form>

      <div className="space-y-3">
        {items.map((item) => <CommentItem key={item.id} item={item} />)}
        {items.length === 0 ? <p className="text-sm text-slate-500">{T.empty}</p> : null}
      </div>
    </section>
  );
}
