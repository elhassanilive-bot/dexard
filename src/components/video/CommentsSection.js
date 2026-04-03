"use client";

import { useEffect, useState } from "react";
import { formatArabicDate } from "@/lib/video/format";

const T = {
  user: "\u0645\u0633\u062a\u062e\u062f\u0645",
  title: "\u0627\u0644\u062a\u0639\u0644\u064a\u0642\u0627\u062a",
  bodyPlaceholder: "\u0627\u0643\u062a\u0628 \u062a\u0639\u0644\u064a\u0642\u0643 \u0647\u0646\u0627",
  parentPlaceholder: "\u0645\u0639\u0631\u0651\u0641 \u062a\u0639\u0644\u064a\u0642 \u0644\u0644\u0631\u062f (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)",
  post: "\u0646\u0634\u0631 \u0627\u0644\u062a\u0639\u0644\u064a\u0642",
  needAuth: "\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0625\u0636\u0627\u0641\u0629 \u062a\u0639\u0644\u064a\u0642",
  empty: "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0639\u0644\u064a\u0642\u0627\u062a \u0628\u0639\u062f",
};

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
  const [loading, setLoading] = useState(false);

  async function loadComments() {
    const response = await fetch(`/api/videos/${videoId}/comments`);
    if (!response.ok) return;
    const payload = await response.json();
    setItems(payload.items || []);
  }

  useEffect(() => {
    loadComments();
  }, [videoId]);

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
      await loadComments();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-black text-slate-900">{T.title}</h2>

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