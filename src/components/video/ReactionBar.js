"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCompactNumber } from "@/lib/video/format";
import styles from "./ReactionBar.module.css";

function LikeOutlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9V5.25A2.25 2.25 0 0 0 12 3l-3 6v12h8.25a3.75 3.75 0 0 0 3.75-3.75V11.25A2.25 2.25 0 0 0 18.75 9h-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5.25A2.25 2.25 0 0 1 3 18.75v-7.5A2.25 2.25 0 0 1 5.25 9H9" />
    </svg>
  );
}

function LikeFilledIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M11.246 3.042A2.25 2.25 0 0 1 15 5.25V9h3.75A2.25 2.25 0 0 1 21 11.25v6a3.75 3.75 0 0 1-3.75 3.75H9V9l2.246-5.958Z" />
      <path d="M7.5 9H5.25A2.25 2.25 0 0 0 3 11.25v7.5A2.25 2.25 0 0 0 5.25 21H7.5V9Z" />
    </svg>
  );
}

function DislikeOutlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15V18.75A2.25 2.25 0 0 0 12 21l3-6V3H6.75A3.75 3.75 0 0 0 3 6.75v6A2.25 2.25 0 0 0 5.25 15h4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h3.75A2.25 2.25 0 0 1 21 5.25v7.5A2.25 2.25 0 0 1 18.75 15H15" />
    </svg>
  );
}

function DislikeFilledIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M9 3H6.75A3.75 3.75 0 0 0 3 6.75v6A2.25 2.25 0 0 0 5.25 15h3.75v3.75A2.25 2.25 0 0 0 12.754 20.958L15 15V3H9Z" />
      <path d="M16.5 3v12h2.25A2.25 2.25 0 0 0 21 12.75v-7.5A2.25 2.25 0 0 0 18.75 3H16.5Z" />
    </svg>
  );
}

export default function ReactionBar({ videoId, initialLike = 0, initialDislike = 0, initialReaction = 0, accessToken }) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLike);
  const [dislikes, setDislikes] = useState(initialDislike);
  const [reaction, setReaction] = useState(initialReaction);
  const [loading, setLoading] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [dislikeBurst, setDislikeBurst] = useState(false);

  useEffect(() => {
    if (!likeBurst) return;
    const t = window.setTimeout(() => setLikeBurst(false), 2800);
    return () => window.clearTimeout(t);
  }, [likeBurst]);

  useEffect(() => {
    if (!dislikeBurst) return;
    const t = window.setTimeout(() => setDislikeBurst(false), 2800);
    return () => window.clearTimeout(t);
  }, [dislikeBurst]);

  useEffect(() => {
    let alive = true;

    async function loadReactionState() {
      if (!accessToken) return;

      const response = await fetch(`/api/videos/${videoId}/reaction`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!response.ok) return;

      const payload = await response.json();
      if (!alive) return;

      // Important: only sync user's icon state here.
      // Keep counters from SSR/POST to avoid accidental zeroing.
      setReaction(Number(payload?.reaction || 0));
    }

    loadReactionState();
    return () => {
      alive = false;
    };
  }, [videoId, accessToken]);

  async function react(nextReaction) {
    if (!accessToken) {
      router.push("/auth");
      return;
    }
    if (loading) return;

    const previous = reaction;
    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ reaction: nextReaction }),
      });
      if (!response.ok) return;
      const payload = await response.json();
      const newReaction = payload.reaction || 0;
      setLikes(Number(payload?.likes_count || 0));
      setDislikes(Number(payload?.dislikes_count || 0));
      setReaction(newReaction);

      if (newReaction === 1 && previous !== 1) setLikeBurst(true);
      if (newReaction === -1 && previous !== -1) setDislikeBurst(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 p-1 shadow-sm">
      <button
        type="button"
        onClick={() => react(reaction === 1 ? 0 : 1)}
        disabled={loading}
        aria-label="إعجاب"
        title="إعجاب"
        className={[
          "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition-all duration-200",
          reaction === 1 ? "bg-white text-blue-700 shadow-sm" : "text-slate-700 hover:bg-white/70",
          likeBurst ? styles.buttonHitLike : "",
        ].join(" ")}
      >
        <span className={[styles.thumbIcon, likeBurst ? styles.thumbHit : ""].join(" ")}>
          {reaction === 1 ? <LikeFilledIcon /> : <LikeOutlineIcon />}
        </span>
        <span>{formatCompactNumber(likes)}</span>
      </button>

      <span className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />

      <button
        type="button"
        onClick={() => react(reaction === -1 ? 0 : -1)}
        disabled={loading}
        aria-label="عدم إعجاب"
        title="عدم إعجاب"
        className={[
          "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition-all duration-200",
          reaction === -1 ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:bg-white/70",
          dislikeBurst ? styles.buttonHitDislike : "",
        ].join(" ")}
      >
        <span className={[styles.thumbIcon, dislikeBurst ? styles.thumbHit : ""].join(" ")}>
          {reaction === -1 ? <DislikeFilledIcon /> : <DislikeOutlineIcon />}
        </span>
        <span>{formatCompactNumber(dislikes)}</span>
      </button>
    </div>
  );
}
