"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const T = {
  subscribed: "مشترك",
  subscribe: "اشتراك",
};

export default function SubscribeButton({ username, initialSubscribed, initialCount, accessToken }) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(Boolean(initialSubscribed));
  const [count, setCount] = useState(Number(initialCount || 0));
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!accessToken) {
      router.push("/auth");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/channels/${encodeURIComponent(username)}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return;
      const payload = await response.json();
      setSubscribed(Boolean(payload.subscribed));
      setCount(Number(payload.subscribers_count || 0));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={toggle} disabled={loading} className={["rounded-full px-5 py-2 text-sm font-bold", subscribed ? "border border-slate-300 bg-white text-slate-800" : "bg-red-700 text-white"].join(" ")}>
      {subscribed ? T.subscribed : T.subscribe} ({count})
    </button>
  );
}
