"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
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
      aria-label="نسخ الرابط"
      title={copied ? "تم النسخ" : failed ? "تعذر النسخ" : "نسخ الرابط"}
      className={[
        "inline-flex items-center justify-center rounded-full border p-2.5 transition",
        copied ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-700",
        failed ? "border-rose-300 bg-rose-50 text-rose-700" : "",
      ].join(" ")}
    >
      <CopyIcon />
    </button>
  );
}
