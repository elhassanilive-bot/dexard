"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatCompactNumber, formatDuration } from "@/lib/video/format";
import { slugifyUsername } from "@/lib/video/format";

const T = {
  loading: "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062d\u0633\u0627\u0628...",
  needSignin: "\u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648\u0644\u0627\u064b",
  unavailable: "Supabase \u063a\u064a\u0631 \u0645\u062a\u0627\u062d",
  saved: "\u062a\u0645 \u062d\u0641\u0638 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628 \u0628\u0646\u062c\u0627\u062d",
  failed: "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a",
  title: "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628 \u0648\u0627\u0644\u0642\u0646\u0627\u0629",
  displayName: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0638\u0627\u0647\u0631",
  username: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0641\u0631\u064a\u062f",
  avatar: "\u0631\u0627\u0628\u0637 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0634\u062e\u0635\u064a\u0629",
  bio: "\u0646\u0628\u0630\u0629 \u0627\u0644\u0642\u0646\u0627\u0629",
  save: "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a",
  saving: "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...",
  savedVideos: "\u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0627\u062a",
  loadingSaved: "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0627\u062a...",
  noSaved: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0645\u062d\u0641\u0648\u0638\u0629 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646",
  views: "\u0645\u0634\u0627\u0647\u062f\u0629",
};

export default function AccountSettingsShell() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savedItems, setSavedItems] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadSavedVideos(accessToken) {
      if (!accessToken || !alive) return;
      setSavedLoading(true);
      try {
        const response = await fetch("/api/me/saved-videos", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (alive) setSavedItems(Array.isArray(payload?.items) ? payload.items : []);
      } finally {
        if (alive) setSavedLoading(false);
      }
    }

    async function load() {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) return;

        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!session) {
          if (alive) setError(T.needSignin);
          return;
        }

        if (!alive) return;
        setUser(session.user);

        const { data: profile } = await supabase.from("profiles").select("display_name,username,bio,avatar_url").eq("id", session.user.id).maybeSingle();

        if (!alive) return;
        setDisplayName(profile?.display_name || session.user.user_metadata?.display_name || "");
        setUsername(profile?.username || session.user.user_metadata?.username || "");
        setBio(profile?.bio || "");
        setAvatarUrl(profile?.avatar_url || session.user.user_metadata?.avatar_url || "");

        await loadSavedVideos(session.access_token);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!user) return;

    setSaving(true);
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error(T.unavailable);

      const cleanUsername = slugifyUsername(username || displayName || user.email?.split("@")[0]);

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          username: cleanUsername || `user_${user.id.slice(0, 8)}`,
          display_name: displayName || cleanUsername,
          bio,
          avatar_url: avatarUrl || null,
        },
        { onConflict: "id" }
      );
      if (profileError) throw profileError;

      await supabase.auth.updateUser({ data: { display_name: displayName, username: cleanUsername, avatar_url: avatarUrl } });
      setMessage(T.saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : T.failed);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-slate-600">{T.loading}</div>;

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-[0_25px_70px_-45px_rgba(15,23,42,0.45)]">
        <h1 className="text-2xl font-black text-slate-900">{T.title}</h1>

        <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{T.displayName}</span><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
        <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{T.username}</span><input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
        <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{T.avatar}</span><input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
        <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{T.bio}</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>

        {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

        <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-6 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? T.saving : T.save}</button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-[0_25px_70px_-45px_rgba(15,23,42,0.45)]">
        <h2 className="text-xl font-black text-slate-900">{T.savedVideos}</h2>

        {savedLoading ? <p className="mt-4 text-sm text-slate-500">{T.loadingSaved}</p> : null}

        {!savedLoading && savedItems.length === 0 ? <p className="mt-4 text-sm text-slate-500">{T.noSaved}</p> : null}

        {savedItems.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedItems.map((video) => (
              <Link key={video.id} href={`/watch/${video.id}`} className="overflow-hidden rounded-2xl border border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative aspect-video bg-slate-200">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                  <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white">{formatDuration(video.duration_sec)}</span>
                </div>
                <div className="space-y-1 p-3">
                  <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{video.title}</h3>
                  <p className="text-xs text-slate-500">{video.channel?.display_name || video.channel?.username}</p>
                  <p className="text-xs text-slate-500">{formatCompactNumber(video.views_count)} {T.views}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
