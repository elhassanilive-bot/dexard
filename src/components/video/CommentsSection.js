"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatArabicDate, formatCompactNumber } from "@/lib/video/format";
import InteractiveText from "@/components/video/InteractiveText";

const T = {
  user: "مستخدم",
  title: "التعليقات",
  bodyPlaceholder: "اكتب تعليقك هنا",
  post: "نشر التعليق",
  empty: "لا توجد تعليقات بعد",
  newest: "الأحدث",
  oldest: "الأقدم",
  top: "الأكثر تفاعلًا",
  reply: "رد",
  sendReply: "إرسال",
  replyPlaceholder: "اكتب ردك...",
  showReplies: "عرض الردود",
  hideReplies: "إخفاء الردود",
  repliesWord: "ردود",
  replyTo: "رد على",
  publisher: "الناشر",
  copyLink: "نسخ رابط",
  copied: "تم النسخ",
  jumpNew: "الانتقال لأول رد جديد",
  showMore: "عرض المزيد",
};

const REPLIES_PAGE_SIZE = 10;

const SORTS = [
  { key: "latest", label: T.newest },
  { key: "oldest", label: T.oldest },
  { key: "top", label: T.top },
];

function getDisplayName(item) {
  return item?.profile?.display_name || item?.profile?.username || T.user;
}

function toTs(value) {
  const t = new Date(value || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

function getSeenRepliesStorageKey(videoId) {
  return `dexard_seen_replies_${videoId}`;
}

function flattenReplyThread(replies, parentName) {
  const flat = [];

  function walk(list, replyToName) {
    for (const node of list || []) {
      flat.push({ node, replyToName });
      walk(node.replies || [], getDisplayName(node));
    }
  }

  walk(replies || [], parentName);
  return flat;
}

function SortIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M3.75 6h3.75m3 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 12h.75m-16.5 0h9.75m0 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM10.5 18h9.75m-16.5 0h3.75m3 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function HeartOutlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
    </svg>
  );
}

function DislikeOutlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
    </svg>
  );
}

function DislikeFilledIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M15.73 5.5h1.035A7.465 7.465 0 0 1 18 9.625a7.465 7.465 0 0 1-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.499 4.499 0 0 0-.322 1.672v.633A.75.75 0 0 1 9 22a2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 0 1 1.5 12.25c0-2.848.992-5.464 2.649-7.521C4.537 4.247 5.136 4 5.754 4H9.77a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23ZM21.669 14.023c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.958 8.958 0 0 1-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227Z" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75 5.25 6.375m0 0L8.625 3m-3.375 3.375h9a4.5 4.5 0 0 1 0 9h-1.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m13.19 8.688 4.122-4.122a3 3 0 1 1 4.243 4.243l-4.122 4.122m-2.12 2.121-4.123 4.122a3 3 0 1 1-4.243-4.243l4.122-4.122m2.121-2.121 2.122 2.122" />
    </svg>
  );
}

function updateCommentInTree(list, commentId, updater) {
  return (list || []).map((item) => {
    if (item.id === commentId) return updater(item);
    if (!item.replies?.length) return item;
    return { ...item, replies: updateCommentInTree(item.replies, commentId, updater) };
  });
}

function CommentNode({ item, accessToken, onReact, onReply, onRequireAuth, replyToName = null, compact = false, onCopyLink, copiedId }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  async function submitReply(event) {
    event.preventDefault();
    if (!accessToken) return onRequireAuth();
    if (!replyBody.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const ok = await onReply(item.id, replyBody.trim());
      if (ok) {
        setReplyBody("");
        setReplyOpen(false);
      }
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <article id={`comment-${item.id}`} className={["rounded-xl border border-slate-200 bg-white text-right scroll-mt-24", compact ? "p-2.5" : "p-3"].join(" ")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="truncate text-sm font-semibold text-slate-900">{getDisplayName(item)}</h4>
          {item.is_creator ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{T.publisher}</span> : null}
        </div>
        <span className="text-[11px] text-slate-500">{formatArabicDate(item.created_at)}</span>
      </div>

      {replyToName ? (
        <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
          <span>{T.replyTo}</span>
          <span className="font-semibold text-slate-700">@{replyToName}</span>
        </div>
      ) : null}

      <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700"><InteractiveText text={item.body} /></div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => {
            if (!accessToken) return onRequireAuth();
            onReact(item.id, item.user_reaction === 1 ? 0 : 1);
          }}
          className={[
            "inline-flex items-center gap-1 rounded-full border px-2 py-1 transition",
            item.user_reaction === 1 ? "border-red-300 bg-red-50 text-red-600" : "border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          {item.user_reaction === 1 ? <HeartFilledIcon /> : <HeartOutlineIcon />}
          <span>{formatCompactNumber(item.likes_count || 0)}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!accessToken) return onRequireAuth();
            onReact(item.id, item.user_reaction === -1 ? 0 : -1);
          }}
          className={[
            "inline-flex items-center gap-1 rounded-full border px-2 py-1 transition",
            item.user_reaction === -1 ? "border-slate-700 bg-slate-800 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          {item.user_reaction === -1 ? <DislikeFilledIcon /> : <DislikeOutlineIcon />}
          <span>{formatCompactNumber(item.dislikes_count || 0)}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!accessToken) return onRequireAuth();
            const mentionName = String(item?.profile?.username || "").replace(/^@+/, "");
            setReplyOpen((prev) => {
              const next = !prev;
              if (next && mentionName) {
                setReplyBody((curr) => (String(curr || "").trim() ? curr : `@${mentionName} `));
              }
              return next;
            });
          }}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-slate-600 transition hover:bg-slate-50"
        >
          <ReplyIcon />
          <span>{T.reply}</span>
        </button>

        <button
          type="button"
          onClick={() => onCopyLink(item.id)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-slate-600 transition hover:bg-slate-50"
        >
          <LinkIcon />
          <span>{copiedId === item.id ? T.copied : T.copyLink}</span>
        </button>
      </div>

      {replyOpen ? (
        <form onSubmit={submitReply} className="mt-2 flex items-center gap-2">
          <button type="submit" disabled={sendingReply || !replyBody.trim()} className="shrink-0 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            {T.sendReply}
          </button>
          <input
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            placeholder={T.replyPlaceholder}
            className="w-full rounded-full border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-slate-500"
          />
        </form>
      ) : null}
    </article>
  );
}

export default function CommentsSection({ videoId, accessToken }) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState([]);
  const [body, setBody] = useState("");
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(false);
  const [collapsedByRoot, setCollapsedByRoot] = useState({});
  const [replyLimitByRoot, setReplyLimitByRoot] = useState({});
  const [seenReplyAtByRoot, setSeenReplyAtByRoot] = useState({});
  const [copiedCommentId, setCopiedCommentId] = useState(null);

  const requireAuth = useCallback(() => {
    router.push("/auth");
  }, [router]);

  const rootReplyLists = useMemo(() => {
    const map = {};
    for (const root of items) {
      map[root.id] = flattenReplyThread(root.replies || [], getDisplayName(root));
    }
    return map;
  }, [items]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getSeenRepliesStorageKey(videoId));
      const parsed = raw ? JSON.parse(raw) : {};
      setSeenReplyAtByRoot(parsed && typeof parsed === "object" ? parsed : {});
    } catch {
      setSeenReplyAtByRoot({});
    }
  }, [videoId]);

  const persistSeenMap = useCallback(
    (map) => {
      try {
        localStorage.setItem(getSeenRepliesStorageKey(videoId), JSON.stringify(map));
      } catch {
        // ignore local storage errors
      }
    },
    [videoId],
  );

  const markRootSeen = useCallback(
    (rootId, flatReplies) => {
      const latestTs = (flatReplies || []).reduce((max, entry) => Math.max(max, toTs(entry?.node?.created_at)), 0);
      if (!latestTs) return;

      setSeenReplyAtByRoot((prev) => {
        const next = { ...prev, [rootId]: latestTs };
        persistSeenMap(next);
        return next;
      });
    },
    [persistSeenMap],
  );

  const loadComments = useCallback(
    async (activeSort = sort) => {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
      const response = await fetch(`/api/videos/${videoId}/comments?sort=${encodeURIComponent(activeSort)}`, { headers });
      if (!response.ok) return;
      const payload = await response.json();
      setItems(payload.items || []);
    },
    [accessToken, videoId, sort],
  );

  useEffect(() => {
    loadComments(sort);
  }, [loadComments, sort]);

  async function submitRootComment(event) {
    event.preventDefault();
    if (!accessToken) return requireAuth();
    if (!body.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: body.trim(), parent_id: null }),
      });
      if (!response.ok) return;
      setBody("");
      await loadComments(sort);
    } finally {
      setLoading(false);
    }
  }

  async function submitReply(parentId, text) {
    const response = await fetch(`/api/videos/${videoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ body: text, parent_id: parentId }),
    });

    if (!response.ok) return false;
    await loadComments(sort);
    return true;
  }

  async function reactOnComment(commentId, nextReaction) {
    const response = await fetch(`/api/videos/${videoId}/comments/${commentId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ reaction: nextReaction }),
    });

    if (!response.ok) return;
    const payload = await response.json();

    setItems((prev) =>
      updateCommentInTree(prev, commentId, (item) => ({
        ...item,
        user_reaction: Number(payload.reaction || 0),
        likes_count: Number(payload.likes_count || 0),
        dislikes_count: Number(payload.dislikes_count || 0),
      })),
    );
  }

  function copyCommentLink(commentId) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}${pathname}#comment-${commentId}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedCommentId(commentId);
    window.setTimeout(() => setCopiedCommentId(null), 1400);
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

      <form onSubmit={submitRootComment} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={T.bodyPlaceholder} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-300" />
        <button type="submit" disabled={loading || !body.trim()} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {T.post}
        </button>
      </form>

      <div className="space-y-3">
        {items.map((item) => {
          const rootId = item.id;
          const flatReplies = rootReplyLists[rootId] || [];
          const repliesCount = flatReplies.length;
          const isCollapsedDefault = repliesCount >= 2;
          const isCollapsed = collapsedByRoot[rootId] ?? isCollapsedDefault;
          const visibleLimit = replyLimitByRoot[rootId] ?? REPLIES_PAGE_SIZE;
          const visibleReplies = isCollapsed ? [] : flatReplies.slice(0, visibleLimit);
          const remaining = Math.max(0, repliesCount - visibleReplies.length);

          const seenAt = Number(seenReplyAtByRoot[rootId] || 0);
          const newReplies = flatReplies.filter((entry) => toTs(entry?.node?.created_at) > seenAt);
          const firstNew = newReplies[0]?.node || null;

          return (
            <div key={rootId} className="space-y-2">
              <CommentNode
                item={item}
                accessToken={accessToken}
                onReact={reactOnComment}
                onReply={submitReply}
                onRequireAuth={requireAuth}
                onCopyLink={copyCommentLink}
                copiedId={copiedCommentId}
              />

              {repliesCount > 0 ? (
                <div className="relative mr-3 space-y-2 border-r border-slate-200 pr-4">
                  <span className="absolute -right-[5px] top-2 h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />

                  {repliesCount >= 2 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCollapsedByRoot((prev) => ({ ...prev, [rootId]: !isCollapsed }));
                        if (isCollapsed) {
                          setReplyLimitByRoot((prev) => ({ ...prev, [rootId]: REPLIES_PAGE_SIZE }));
                        }
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      {isCollapsed ? `${T.showReplies} +${repliesCount} ${T.repliesWord}` : T.hideReplies}
                    </button>
                  ) : null}

                  {!isCollapsed && firstNew ? (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`comment-${firstNew.id}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        markRootSeen(rootId, flatReplies);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {T.jumpNew} (+{newReplies.length})
                    </button>
                  ) : null}

                  {visibleReplies.map(({ node, replyToName }) => (
                    <CommentNode
                      key={node.id}
                      item={node}
                      accessToken={accessToken}
                      onReact={reactOnComment}
                      onReply={submitReply}
                      onRequireAuth={requireAuth}
                      replyToName={replyToName}
                      compact
                      onCopyLink={copyCommentLink}
                      copiedId={copiedCommentId}
                    />
                  ))}

                  {!isCollapsed && remaining > 0 ? (
                    <button
                      type="button"
                      onClick={() => setReplyLimitByRoot((prev) => ({ ...prev, [rootId]: visibleLimit + REPLIES_PAGE_SIZE }))}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      {T.showMore} +{remaining} {T.repliesWord}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        {items.length === 0 ? <p className="text-sm text-slate-500">{T.empty}</p> : null}
      </div>
    </section>
  );
}

