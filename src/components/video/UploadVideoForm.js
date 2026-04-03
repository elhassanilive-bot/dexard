"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { MAX_VIDEO_DURATION_SECONDS, MAX_VIDEO_SIZE_BYTES, THUMBNAIL_BUCKET, VIDEO_BUCKET } from "@/lib/video/constants";

function fileNameSafe(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.floor(video.duration || 0));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذر قراءة مدة الفيديو"));
    };
    video.src = url;
  });
}

async function generateThumbnailFromVideo(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const targetSecond = Math.min(1, Math.max(0, video.duration / 3));
      video.currentTime = targetSecond;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas غير متاح");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error("تعذر توليد الصورة المصغرة"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.85
        );
      } catch (drawError) {
        URL.revokeObjectURL(url);
        reject(drawError instanceof Error ? drawError : new Error("تعذر توليد الصورة"));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذر فتح الفيديو لتوليد الصورة"));
    };
  });
}

export default function UploadVideoForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("عام");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const keywordList = useMemo(() => {
    return keywords
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }, [keywords]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!videoFile) {
      setError("يرجى اختيار ملف فيديو.");
      return;
    }

    if (videoFile.size > MAX_VIDEO_SIZE_BYTES) {
      setError("حجم الفيديو أكبر من الحد المسموح (500MB).");
      return;
    }

    setPending(true);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error("Supabase غير مهيأ.");

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) throw new Error("يجب تسجيل الدخول قبل رفع الفيديو.");

      const duration = await getVideoDuration(videoFile);
      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        throw new Error("مدة الفيديو تتجاوز الحد المسموح (30 دقيقة).");
      }

      const videoPath = `${session.user.id}/${Date.now()}-${fileNameSafe(videoFile.name)}`;
      const { error: uploadVideoError } = await supabase.storage.from(VIDEO_BUCKET).upload(videoPath, videoFile, {
        contentType: videoFile.type || "video/mp4",
        upsert: false,
      });
      if (uploadVideoError) throw uploadVideoError;

      let thumbnailPath = null;
      const effectiveThumbFile = thumbnailFile || (await generateThumbnailFromVideo(videoFile));
      if (effectiveThumbFile) {
        const thumbName = thumbnailFile?.name || `${fileNameSafe(videoFile.name)}.jpg`;
        thumbnailPath = `${session.user.id}/${Date.now()}-${fileNameSafe(thumbName)}`;
        const { error: uploadThumbError } = await supabase.storage.from(THUMBNAIL_BUCKET).upload(thumbnailPath, effectiveThumbFile, {
          contentType: thumbnailFile?.type || "image/jpeg",
          upsert: false,
        });
        if (uploadThumbError) throw uploadThumbError;
      }

      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          description,
          keywords: keywordList,
          category,
          video_path: videoPath,
          thumbnail_path: thumbnailPath,
          duration_sec: duration,
          size_bytes: videoFile.size,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "فشل حفظ بيانات الفيديو.");

      setMessage("تم رفع الفيديو بنجاح.");
      router.push(`/watch/${payload.video.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "حدث خطأ غير متوقع.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h1 className="text-2xl font-black text-slate-900">رفع فيديو جديد</h1>

      <label className="block text-right">
        <span className="mb-1 block text-sm font-bold text-slate-700">العنوان</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-xl border border-slate-300 px-3 py-2" />
      </label>

      <label className="block text-right">
        <span className="mb-1 block text-sm font-bold text-slate-700">الوصف</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
      </label>

      <label className="block text-right">
        <span className="mb-1 block text-sm font-bold text-slate-700">كلمات مفتاحية (مفصولة بفاصلة)</span>
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
      </label>

      <label className="block text-right">
        <span className="mb-1 block text-sm font-bold text-slate-700">التصنيف</span>
        <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
      </label>

      <label className="block text-right">
        <span className="mb-1 block text-sm font-bold text-slate-700">ملف الفيديو</span>
        <input type="file" accept="video/*" required onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-slate-300 p-2" />
      </label>

      <label className="block text-right">
        <span className="mb-1 block text-sm font-bold text-slate-700">الصورة المصغرة (اختياري)</span>
        <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-slate-300 p-2" />
      </label>

      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-full bg-red-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "جار الرفع..." : "نشر الفيديو"}
      </button>
    </form>
  );
}