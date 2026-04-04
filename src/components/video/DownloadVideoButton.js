"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DOWNLOADS_KEY = "dexard_downloads";

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function parseFilename(disposition) {
  if (!disposition) return "video.mp4";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || "video.mp4";
}

function saveDownloadItem(videoId, filename) {
  try {
    const raw = localStorage.getItem(DOWNLOADS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];

    const item = {
      id: `${videoId}-${Date.now()}`,
      video_id: videoId,
      filename,
      downloaded_at: new Date().toISOString(),
    };

    const next = [item, ...list].slice(0, 100);
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next));
  } catch {
    // ignore localStorage failures
  }
}

export default function DownloadVideoButton({ videoId, accessToken }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  async function download() {
    if (!accessToken) {
      router.push("/auth");
      return;
    }
    if (loading) return;

    setLoading(true);
    setFailed(false);

    try {
      const response = await fetch(`/api/videos/${videoId}/download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error("download-failed");

      const blob = await response.blob();
      const filename = parseFilename(response.headers.get("content-disposition"));
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      saveDownloadItem(videoId, filename);
      setDone(true);
      window.setTimeout(() => setDone(false), 1400);
    } catch {
      setFailed(true);
      window.setTimeout(() => setFailed(false), 1600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={loading}
      aria-label="تنزيل الفيديو"
      title={done ? "تم التنزيل" : failed ? "تعذر التنزيل" : "تنزيل الفيديو"}
      className={[
        "inline-flex items-center justify-center rounded-full border p-2.5 transition",
        done ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-700",
        failed ? "border-rose-300 bg-rose-50 text-rose-700" : "",
      ].join(" ")}
    >
      <DownloadIcon />
    </button>
  );
}
