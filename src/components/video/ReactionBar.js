"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCompactNumber } from "@/lib/video/format";

function HeartOutlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
    </svg>
  );
}

function DislikeOutlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
    </svg>
  );
}

function DislikeFilledIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M15.73 5.5h1.035A7.465 7.465 0 0 1 18 9.625a7.465 7.465 0 0 1-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.499 4.499 0 0 0-.322 1.672v.633A.75.75 0 0 1 9 22a2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 0 1 1.5 12.25c0-2.848.992-5.464 2.649-7.521C4.537 4.247 5.136 4 5.754 4H9.77a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23ZM21.669 14.023c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.958 8.958 0 0 1-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227Z" />
    </svg>
  );
}

export default function ReactionBar({ videoId, initialLike = 0, initialDislike = 0, initialReaction = 0, accessToken }) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLike);
  const [dislikes, setDislikes] = useState(initialDislike);
  const [reaction, setReaction] = useState(initialReaction);
  const [loading, setLoading] = useState(false);

  async function react(nextReaction) {
    if (!accessToken) {
      router.push("/auth");
      return;
    }
    if (loading) return;

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
      <button
        type="button"
        onClick={() => react(reaction === 1 ? 0 : 1)}
        disabled={loading}
        aria-label="إعجاب"
        title="إعجاب"
        className={[
          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition",
          reaction === 1 ? "border-red-300 bg-red-50 text-red-600" : "border-slate-300 text-slate-700",
        ].join(" ")}
      >
        {reaction === 1 ? <HeartFilledIcon /> : <HeartOutlineIcon />}
        <span>{formatCompactNumber(likes)}</span>
      </button>

      <button
        type="button"
        onClick={() => react(reaction === -1 ? 0 : -1)}
        disabled={loading}
        aria-label="عدم إعجاب"
        title="عدم إعجاب"
        className={[
          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition",
          reaction === -1 ? "border-slate-800 bg-slate-900 text-white" : "border-slate-300 text-slate-700",
        ].join(" ")}
      >
        {reaction === -1 ? <DislikeFilledIcon /> : <DislikeOutlineIcon />}
        <span>{formatCompactNumber(dislikes)}</span>
      </button>
    </div>
  );
}
