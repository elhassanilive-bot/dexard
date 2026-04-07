"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LottieIcon from "@/components/ui/LottieIcon";

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907 15.5 6.5m0 0a2 2 0 1 0-1.996-2.003A2 2 0 0 0 15.5 6.5ZM7.217 13.093 15.5 17.5m0 0a2 2 0 1 1-1.996 2.003A2 2 0 0 1 15.5 17.5ZM5.5 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}

function buildShareUrl(videoId) {
  if (typeof window === "undefined") return `/watch/${videoId}`;
  return `${window.location.origin}/watch/${videoId}`;
}

async function fallbackCopy(text) {
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.focus();
  input.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(input);
  return ok;
}

export default function CopyVideoLinkButton({ videoId, accessToken }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [shareAnim, setShareAnim] = useState(0);
  const shareUrl = useMemo(() => buildShareUrl(videoId), [videoId]);

  async function copyLink() {
    if (!accessToken) {
      router.push("/auth");
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ok = await fallbackCopy(shareUrl);
        if (!ok) throw new Error("copy-failed");
      }

      setShareAnim(Date.now());
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setFailed(true);
      setCopied(false);
      window.setTimeout(() => setFailed(false), 1600);
    }
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      aria-label="مشاركة"
      title={copied ? "تم النسخ" : failed ? "تعذر النسخ" : "مشاركة"}
      className={[
        "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-200",
        copied ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "",
        failed ? "border-rose-300 bg-rose-50 text-rose-700" : "",
      ].join(" ")}
    >
      <LottieIcon jsonPath="/animations/share.json" playToken={shareAnim} className="h-5 w-5" fallback={<ShareIcon />} />
      <span>{copied ? "تم النسخ" : "مشاركة"}</span>
    </button>
  );
}
