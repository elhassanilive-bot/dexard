"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function SaveOutlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  );
}

function SaveFilledIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
    </svg>
  );
}

export default function SavedVideoButton({ videoId, accessToken }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadStatus() {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
      const response = await fetch(`/api/videos/${videoId}/save`, { headers });
      if (!response.ok) return;
      const payload = await response.json();
      if (!alive) return;
      setSaved(Boolean(payload?.saved));
      setSavedCount(Number(payload?.saved_count || 0));
    }

    loadStatus();
    return () => {
      alive = false;
    };
  }, [videoId, accessToken]);

  async function toggleSaved() {
    if (!accessToken) {
      router.push("/auth");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return;
      const payload = await response.json();
      setSaved(Boolean(payload?.saved));
      setSavedCount(Number(payload?.saved_count || 0));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleSaved}
      disabled={loading}
      aria-label="حفظ"
      title="حفظ"
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition",
        saved ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-300 text-slate-700",
      ].join(" ")}
    >
      {saved ? <SaveFilledIcon /> : <SaveOutlineIcon />}
      <span>{savedCount}</span>
    </button>
  );
}
