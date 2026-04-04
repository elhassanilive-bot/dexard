"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

const T = {
  subscribe: "اشتراك",
  subscribed: "مشترك",
  loading: "...",
};

export default function ChannelSubscribeButton({ username, channelId, initialCount = 0 }) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [viewerId, setViewerId] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [count, setCount] = useState(Number(initialCount || 0));
  const [loading, setLoading] = useState(false);

  const isOwner = useMemo(() => Boolean(viewerId && channelId && viewerId === channelId), [viewerId, channelId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      const supabase = await getSupabaseClient();
      if (!supabase || !alive) return;

      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;
      const token = session?.access_token || "";
      const uid = session?.user?.id || "";

      if (!alive) return;
      setAccessToken(token);
      setViewerId(uid);

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await fetch(`/api/channels/${encodeURIComponent(username)}/subscribe`, { method: "GET", headers });
      if (!response.ok) return;
      const payload = await response.json();
      if (!alive) return;

      setSubscribed(Boolean(payload?.subscribed));
      setCount(Number(payload?.subscribers_count || 0));
    }

    load();
    return () => {
      alive = false;
    };
  }, [username]);

  async function toggle() {
    if (loading || isOwner) return;

    if (!accessToken) {
      router.push(`/auth?next=${encodeURIComponent(`/channel/${username}`)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/channels/${encodeURIComponent(username)}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) return;
      const payload = await response.json();
      setSubscribed(Boolean(payload?.subscribed));
      setCount(Number(payload?.subscribers_count || 0));
    } finally {
      setLoading(false);
    }
  }

  if (isOwner) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={[
        "rounded-full px-6 py-2 text-sm font-bold transition",
        subscribed ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800",
      ].join(" ")}
    >
      {loading ? T.loading : subscribed ? `${T.subscribed} (${count})` : `${T.subscribe} (${count})`}
    </button>
  );
}
