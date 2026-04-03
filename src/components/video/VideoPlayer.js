"use client";

import { useEffect } from "react";

const T = {
  noSource: "\u0645\u0635\u062f\u0631 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d",
  noSupport: "\u0645\u062a\u0635\u0641\u062d\u0643 \u0644\u0627 \u064a\u062f\u0639\u0645 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0641\u064a\u062f\u064a\u0648",
};

export default function VideoPlayer({ src, poster, title, videoId }) {
  useEffect(() => {
    if (!videoId) return;
    const timer = setTimeout(() => {
      fetch(`/api/videos/${videoId}/view`, { method: "POST" }).catch(() => null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [videoId]);

  if (!src) {
    return <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-200 text-slate-600">{T.noSource}</div>;
  }

  return (
    <video controls playsInline preload="metadata" poster={poster || undefined} muted className="aspect-video w-full rounded-2xl bg-black" title={title}>
      <source src={src} />
      {T.noSupport}
    </video>
  );
}