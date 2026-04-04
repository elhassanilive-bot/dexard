"use client";

import VideoGrid from "@/components/video/VideoGrid";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  async function loadHistory(currentToken) {
    const response = await fetch("/api/me/history", {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error || "تعذر تحميل سجل المشاهدة");
    }
    const payload = await response.json();
    setItems(Array.isArray(payload?.items) ? payload.items : []);
  }

  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) throw new Error("Supabase غير مهيأ");
        const { data } = await supabase.auth.getSession();
        const accessToken = data?.session?.access_token || "";
        if (!accessToken) {
          router.push("/auth");
          return;
        }
        if (!alive) return;
        setToken(accessToken);
        await loadHistory(accessToken);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل السجل");
      } finally {
        if (alive) setLoading(false);
      }
    }

    init();
    return () => {
      alive = false;
    };
  }, [router]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime()),
    [items]
  );

  async function clearHistory() {
    if (!token) return;
    const response = await fetch("/api/me/history", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) setItems([]);
  }

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-right text-3xl font-black text-slate-900">سجل المشاهدة</h1>
        {sorted.length > 0 ? (
          <button type="button" onClick={clearHistory} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100">
            مسح السجل
          </button>
        ) : null}
      </div>

      {loading ? <p className="text-right text-sm text-slate-500">جاري التحميل...</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-right text-sm text-rose-700">{error}</p> : null}
      {!loading && !error && sorted.length === 0 ? <p className="text-right text-sm text-slate-500">لا يوجد سجل مشاهدة بعد</p> : null}
      {!loading && !error && sorted.length > 0 ? <VideoGrid videos={sorted} /> : null}
    </section>
  );
}
