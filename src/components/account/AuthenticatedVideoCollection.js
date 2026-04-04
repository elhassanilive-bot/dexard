"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VideoGrid from "@/components/video/VideoGrid";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AuthenticatedVideoCollection({ title, endpoint, emptyText, mode = "library", allowPin = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) throw new Error("Supabase غير مهيأ");
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token || "";
        if (!token) {
          router.push("/auth");
          return;
        }

        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "تعذر تحميل البيانات");
        }

        const payload = await response.json();
        if (!alive) return;
        setItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل البيانات");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [endpoint, router, refreshTick]);

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-right text-3xl font-black text-slate-900">{title}</h1>
      {loading ? <p className="text-right text-sm text-slate-500">جاري التحميل...</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-right text-sm text-rose-700">{error}</p> : null}
      {!loading && !error && items.length === 0 ? <p className="text-right text-sm text-slate-500">{emptyText}</p> : null}
      {!loading && !error && items.length > 0 ? <VideoGrid videos={items} mode={mode} allowPin={allowPin} onPinChanged={() => setRefreshTick((v) => v + 1)} /> : null}
    </section>
  );
}
