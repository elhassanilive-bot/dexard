"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatCompactNumber, formatDuration } from "@/lib/video/format";
import { slugifyUsername } from "@/lib/video/format";

const AVATAR_BUCKET = "avatars";
const COVER_BUCKET = "covers";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const T = {
  loading: "جاري تحميل الحساب...",
  needSignin: "يرجى تسجيل الدخول أولاً",
  unavailable: "Supabase غير متاح",
  saved: "تم حفظ بيانات الحساب بنجاح",
  failed: "تعذر حفظ البيانات",
  title: "إعدادات الحساب والقناة",
  displayName: "الاسم الظاهر",
  username: "اسم المستخدم الفريد",
  avatar: "الصورة الشخصية",
  cover: "صورة الغلاف",
  avatarHint: "اختر صورة واضحة (PNG/JPG/WebP) بحجم أقصى 5MB",
  coverHint: "يفضل مقاس عريض (PNG/JPG/WebP) بحجم أقصى 5MB",
  avatarPick: "اختيار صورة",
  avatarRemove: "حذف الصورة",
  coverPick: "اختيار غلاف",
  coverRemove: "حذف الغلاف",
  avatarUploading: "جاري رفع الصورة...",
  coverUploading: "جاري رفع الغلاف...",
  invalidAvatarType: "يرجى اختيار صورة بصيغة PNG أو JPG أو WebP",
  invalidAvatarSize: "حجم الصورة كبير. الحد الأقصى 5MB",
  bio: "نبذة القناة",
  profilePreview: "معاينة الملف الشخصي",
  visitChannel: "زيارة القناة",
  save: "حفظ التغييرات",
  saving: "جاري الحفظ...",
  savedVideos: "المحفوظات",
  loadingSaved: "جاري تحميل المحفوظات...",
  noSaved: "لا توجد فيديوهات محفوظة حتى الآن",
  views: "مشاهدة",
};

function sanitizeFileName(name) {
  return String(name || "avatar")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(-64);
}

export default function AccountSettingsShell() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const normalizedUsername = slugifyUsername(String(username || "").replace(/^@+/, ""));
  const profileHandle = normalizedUsername ? `@${normalizedUsername}` : "@user";

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

        const { data: profile } = await supabase.from("profiles").select("display_name,username,bio,avatar_url,cover_url").eq("id", session.user.id).maybeSingle();

        if (!alive) return;
        setDisplayName(profile?.display_name || session.user.user_metadata?.display_name || "");
        setUsername(profile?.username || session.user.user_metadata?.username || "");
        setBio(profile?.bio || "");
        setAvatarUrl(profile?.avatar_url || session.user.user_metadata?.avatar_url || "");
        setCoverUrl(profile?.cover_url || session.user.user_metadata?.cover_url || "");

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

  function onAvatarPick(event) {
    setMessage("");
    setError("");

    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(T.invalidAvatarType);
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError(T.invalidAvatarSize);
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  }

  function onCoverPick(event) {
    setMessage("");
    setError("");

    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(T.invalidAvatarType);
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError(T.invalidAvatarSize);
      event.target.value = "";
      return;
    }

    setCoverFile(file);
    setCoverUrl(URL.createObjectURL(file));
  }

  function removeAvatar() {
    setAvatarFile(null);
    setAvatarUrl("");
    setMessage("");
    setError("");
  }

  function removeCover() {
    setCoverFile(null);
    setCoverUrl("");
    setMessage("");
    setError("");
  }

  async function uploadAvatarIfNeeded(supabase, userId) {
    if (!avatarFile) return avatarUrl || null;

    setUploadingAvatar(true);
    try {
      const ext = avatarFile.type === "image/png" ? "png" : avatarFile.type === "image/webp" ? "webp" : "jpg";
      const fileName = sanitizeFileName(avatarFile.name);
      const objectPath = `${userId}/${Date.now()}-${fileName || `avatar.${ext}`}`;

      const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(objectPath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
      const nextUrl = publicData?.publicUrl || "";
      if (!nextUrl) throw new Error("تعذر توليد رابط الصورة بعد الرفع");

      return nextUrl;
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function uploadCoverIfNeeded(supabase, userId) {
    if (!coverFile) return coverUrl || null;

    setUploadingCover(true);
    try {
      const ext = coverFile.type === "image/png" ? "png" : coverFile.type === "image/webp" ? "webp" : "jpg";
      const fileName = sanitizeFileName(coverFile.name);
      const objectPath = `${userId}/${Date.now()}-${fileName || `cover.${ext}`}`;

      const { error: uploadError } = await supabase.storage.from(COVER_BUCKET).upload(objectPath, coverFile, {
        cacheControl: "3600",
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(COVER_BUCKET).getPublicUrl(objectPath);
      const nextUrl = publicData?.publicUrl || "";
      if (!nextUrl) throw new Error("تعذر توليد رابط الغلاف بعد الرفع");

      return nextUrl;
    } finally {
      setUploadingCover(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!user) return;

    setSaving(true);
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error(T.unavailable);

      const cleanUsername = normalizedUsername || slugifyUsername(displayName || user.email?.split("@")[0]);
      const finalAvatarUrl = await uploadAvatarIfNeeded(supabase, user.id);
      const finalCoverUrl = await uploadCoverIfNeeded(supabase, user.id);

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          username: cleanUsername || `user_${user.id.slice(0, 8)}`,
          display_name: displayName || cleanUsername,
          bio,
          avatar_url: finalAvatarUrl || null,
          cover_url: finalCoverUrl || null,
        },
        { onConflict: "id" }
      );
      if (profileError) throw profileError;

      await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          username: cleanUsername,
          avatar_url: finalAvatarUrl || null,
          cover_url: finalCoverUrl || null,
        },
      });
      setAvatarFile(null);
      setAvatarUrl(finalAvatarUrl || "");
      setCoverFile(null);
      setCoverUrl(finalCoverUrl || "");
      setMessage(T.saved);
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : T.failed;
      if (/bucket/i.test(text) || /not found/i.test(text)) {
        setError(`${text}. تأكد من إنشاء bucket باسم ${AVATAR_BUCKET} و ${COVER_BUCKET} في Supabase.`);
      } else {
        setError(text);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-slate-600">{T.loading}</div>;

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-[0_25px_70px_-45px_rgba(15,23,42,0.45)]">
        <h1 className="text-2xl font-black text-slate-900">{T.title}</h1>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <span className="mb-3 block text-sm font-bold text-slate-700">{T.cover}</span>
          <div className="space-y-3">
            <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
              {coverUrl ? <img src={coverUrl} alt={displayName || normalizedUsername || "cover"} className="h-full w-full object-cover" /> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                {T.coverPick}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onCoverPick} className="hidden" />
              </label>
              <button type="button" onClick={removeCover} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                {T.coverRemove}
              </button>
            </div>
            <p className="text-xs text-slate-500">{uploadingCover ? T.coverUploading : T.coverHint}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <span className="mb-3 block text-sm font-bold text-slate-700">{T.avatar}</span>

          <div className="flex flex-wrap items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200 bg-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName || username || "avatar"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-black text-slate-400">
                  {(displayName || username || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  {T.avatarPick}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatarPick} className="hidden" />
                </label>
                <button type="button" onClick={removeAvatar} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                  {T.avatarRemove}
                </button>
              </div>
              <p className="text-xs text-slate-500">{uploadingAvatar ? T.avatarUploading : T.avatarHint}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <span className="mb-3 block text-sm font-bold text-slate-700">{T.profilePreview}</span>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName || normalizedUsername || "avatar"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-black text-slate-400">
                    {(displayName || normalizedUsername || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{displayName || "اسمك الظاهر"}</p>
                <p className="text-xs text-slate-500">{profileHandle}</p>
              </div>
            </div>
            <Link href={`/channel/${normalizedUsername || "user"}`} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
              {T.visitChannel}
            </Link>
          </div>
        </div>

        <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{T.displayName}</span><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-700">{T.username}</span>
          <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2">
            <span className="text-sm font-semibold text-slate-500">@</span>
            <input
              value={String(username || "").replace(/^@+/, "")}
              onChange={(e) => setUsername(slugifyUsername(e.target.value.replace(/^@+/, "")))}
              className="w-full bg-transparent px-2 text-left outline-none"
              dir="ltr"
            />
          </div>
        </label>
        <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{T.bio}</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>

        {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

        <button type="submit" disabled={saving || uploadingAvatar || uploadingCover} className="rounded-full bg-slate-900 px-6 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? T.saving : T.save}</button>
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

