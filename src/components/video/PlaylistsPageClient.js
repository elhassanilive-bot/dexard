"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

const T = {
  title: "قوائم التشغيل",
  subtitle: "أنشئ ونظم قوائم تشغيلك بسهولة",
  createPlaylist: "إنشاء قائمة تشغيل",
  playlistTitle: "اسم القائمة",
  privacy: "الخصوصية",
  private: "خاصة",
  unlisted: "غير مدرجة",
  public: "عامة",
  create: "إنشاء",
  creating: "جاري الإنشاء...",
  empty: "لا توجد قوائم تشغيل بعد",
  loadFailed: "تعذر تحميل القوائم",
};

async function getAccessToken() {
  const supabase = await getSupabaseClient();
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || "";
}

export default function PlaylistsPageClient() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState("private");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch("/api/me/playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.loadFailed);
      setItems(Array.isArray(payload?.items) ? payload.items : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : T.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function createPlaylist(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || saving) return;

    setSaving(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch("/api/me/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: cleanTitle, privacy }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || T.loadFailed);

      setTitle("");
      await loadItems();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : T.loadFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-right text-2xl font-bold text-slate-900">{T.title}</h1>
        <p className="mt-1 text-right text-sm text-slate-600">{T.subtitle}</p>
      </section>

      <form onSubmit={createPlaylist} className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-right text-base font-bold text-slate-900">{T.createPlaylist}</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_170px_130px]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={T.playlistTitle}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-right text-sm text-slate-800 outline-none ring-0 transition focus:border-slate-500"
          />
          <select
            value={privacy}
            onChange={(event) => setPrivacy(event.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-right text-sm text-slate-700 outline-none"
          >
            <option value="private">{T.private}</option>
            <option value="unlisted">{T.unlisted}</option>
            <option value="public">{T.public}</option>
          </select>
          <button type="submit" disabled={saving || !title.trim()} className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-60">
            {saving ? T.creating : T.create}
          </button>
        </div>
        {error ? <p className="mt-2 text-right text-xs text-rose-600">{error}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? <p className="text-right text-sm text-slate-500">Loading...</p> : null}
        {!loading && items.length === 0 ? <p className="text-right text-sm text-slate-500">{T.empty}</p> : null}

        {!loading && items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-right">
                <h3 className="truncate text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{item.privacy}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
