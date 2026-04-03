"use client";

import { useState } from "react";
import { formatCompactNumber } from "@/lib/video/format";

const T = {
  like: "\u0625\u0639\u062c\u0627\u0628",
  dislike: "\u0639\u062f\u0645 \u0625\u0639\u062c\u0627\u0628",
  needAuth: "\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0644\u062a\u0641\u0627\u0639\u0644",
};

export default function ReactionBar({ videoId, initialLike = 0, initialDislike = 0, initialReaction = 0, accessToken }) {
  const [likes, setLikes] = useState(initialLike);
  const [dislikes, setDislikes] = useState(initialDislike);
  const [reaction, setReaction] = useState(initialReaction);
  const [loading, setLoading] = useState(false);

  async function react(nextReaction) {
    if (!accessToken || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ reaction: nextReaction }),
      });
      if (!response.ok) return;
      const payload = await response.json();
      setLikes(payload.likes_count || 0);
      setDislikes(payload.dislikes_count || 0);
      setReaction(payload.reaction || 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => react(reaction === 1 ? 0 : 1)} disabled={loading || !accessToken} className={["rounded-full border px-4 py-2 text-sm font-bold", reaction === 1 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-700"].join(" ")}>{T.like} {formatCompactNumber(likes)}</button>
      <button onClick={() => react(reaction === -1 ? 0 : -1)} disabled={loading || !accessToken} className={["rounded-full border px-4 py-2 text-sm font-bold", reaction === -1 ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-300 text-slate-700"].join(" ")}>{T.dislike} {formatCompactNumber(dislikes)}</button>
      {!accessToken ? <span className="text-xs text-slate-500">{T.needAuth}</span> : null}
    </div>
  );
}