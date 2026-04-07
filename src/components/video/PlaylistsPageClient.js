"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatArabicDate } from "@/lib/video/format";

const T = {
  title: "\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u062a\u0634\u063a\u064a\u0644",
  subtitle: "\u0623\u0646\u0634\u0626 \u0648\u0646\u0638\u0645 \u0642\u0648\u0627\u0626\u0645 \u062a\u0634\u063a\u064a\u0644\u0643 \u0628\u0633\u0647\u0648\u0644\u0629",
  createPlaylist: "\u0625\u0646\u0634\u0627\u0621 \u0642\u0627\u0626\u0645\u0629 \u062a\u0634\u063a\u064a\u0644",
  playlistTitle: "\u0627\u0633\u0645 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  privacy: "\u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629",
  private: "\u062e\u0627\u0635\u0629",
  unlisted: "\u063a\u064a\u0631 \u0645\u062f\u0631\u062c\u0629",
  public: "\u0639\u0627\u0645\u0629",
  create: "\u0625\u0646\u0634\u0627\u0621",
  creating: "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0646\u0634\u0627\u0621...",
  empty: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0642\u0648\u0627\u0626\u0645 \u062a\u0634\u063a\u064a\u0644 \u0628\u0639\u062f",
  loadFailed: "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0642\u0648\u0627\u0626\u0645",
  videos: "\u0641\u064a\u062f\u064a\u0648",
  open: "\u0641\u062a\u062d \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  copyLink: "\u0646\u0633\u062e \u0631\u0627\u0628\u0637 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  share: "\u0645\u0634\u0627\u0631\u0643\u0629",
  copied: "\u062a\u0645 \u0646\u0633\u062e \u0631\u0627\u0628\u0637 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  untitled: "\u0642\u0627\u0626\u0645\u0629 \u0628\u062f\u0648\u0646 \u0639\u0646\u0648\u0627\u0646",
};

function privacyLabel(value) {
  if (value === "public") return T.public;
  if (value === "unlisted") return T.unlisted;
  return T.private;
}

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

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
    [items]
  );

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

  async function copyPlaylistLink(playlistId) {
    try {
      const url = `${window.location.origin}/playlist/${playlistId}`;
      await navigator.clipboard.writeText(url);
      window.alert(T.copied);
    } catch {
      window.alert(T.loadFailed);
    }
  }

  async function sharePlaylist(playlistId, playlistTitle) {
    const url = `${window.location.origin}/playlist/${playlistId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: playlistTitle || T.untitled, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      window.alert(T.copied);
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-right">
        <h1 className="text-2xl font-bold text-slate-900">{T.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{T.subtitle}</p>
      </section>

      <form onSubmit={createPlaylist} dir="rtl" className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-right text-base font-bold text-slate-900">{T.createPlaylist}</h2>
        <div className="grid gap-2 sm:grid-cols-[130px_170px_1fr]">
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

      <section dir="rtl" className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? <p className="text-right text-sm text-slate-500">Loading...</p> : null}
        {!loading && sortedItems.length === 0 ? <p className="text-right text-sm text-slate-500">{T.empty}</p> : null}

        {!loading && sortedItems.length > 0 ? (
          <div className="space-y-3">
            {sortedItems.map((item, index) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div dir="rtl" className="min-w-0 text-right">
                    <div className="flex w-full items-center justify-end gap-2">
                      <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        #{index + 1}
                      </span>
                      <h3 className="w-full truncate text-right text-base font-semibold text-slate-900">{item.title || T.untitled}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {privacyLabel(item.privacy)} - {Number(item.videos_count || 0)} {T.videos}
                      {item.created_at ? ` - ${formatArabicDate(item.created_at)}` : ""}
                    </p>
                    {item.description ? <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.description}</p> : null}
                  </div>

                  <div className="flex flex-row-reverse items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyPlaylistLink(item.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {T.copyLink}
                    </button>
                    <button
                      type="button"
                      onClick={() => sharePlaylist(item.id, item.title)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {T.share}
                    </button>
                    <Link href={`/playlist/${item.id}`} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
                      {T.open}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

