"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const targetSecond = Math.min(1, Math.max(0, video.duration / 3));
      video.currentTime = targetSecond;
    };

    video.onseeked = () => {
      try {
        const srcW = Math.max(1, video.videoWidth || 1280);
        const srcH = Math.max(1, video.videoHeight || 720);
        const maxEdge = 960; // أسرع من 1280 بدون خسارة ملحوظة في المعاينة
        const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(320, Math.round(srcW * scale));
        canvas.height = Math.max(180, Math.round(srcH * scale));

        const context = canvas.getContext("2d", { alpha: false });
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
          0.82
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

const STEPS = [
  { id: 1, title: "التفاصيل" },
  { id: 2, title: "التصنيف" },
  { id: 3, title: "الرفع والمعاينة" },
  { id: 4, title: "المراجعة والنشر" },
];

function withTimeout(promise, ms, timeoutMessage, onTimeout) {
  let timer;
  return new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      try {
        onTimeout?.();
      } catch (_) {}
      reject(new Error(timeoutMessage));
    }, ms);

    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
const CATEGORY_OPTIONS = [
  { value: "general", label: "عام" },
  { value: "education", label: "تعليم" },
  { value: "entertainment", label: "ترفيه" },
  { value: "gaming", label: "ألعاب" },
  { value: "music", label: "موسيقى" },
  { value: "sports", label: "رياضة" },
  { value: "news", label: "أخبار" },
  { value: "technology", label: "تقنية" },
];

export default function UploadVideoForm() {
  const router = useRouter();
  const videoInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("general");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [videoFile]);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbPreviewUrl("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(thumbnailFile);
    setThumbPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [thumbnailFile]);

  function validateStep(targetStep) {
    if (targetStep === 1) {
      if (!title.trim()) {
        setError("يرجى إدخال عنوان الفيديو.");
        return false;
      }
      if (!description.trim()) {
        setError("يرجى إدخال وصف الفيديو.");
        return false;
      }
      if (!keywordList.length) {
        setError("يرجى إدخال كلمة مفتاحية واحدة على الأقل.");
        return false;
      }
    }

    if (targetStep === 2) {
      if (!category.trim()) {
        setError("يرجى اختيار تصنيف الفيديو.");
        return false;
      }
    }

    if (targetStep === 3) {
      if (!videoFile) {
        setError("يرجى اختيار ملف الفيديو.");
        return false;
      }
      if (videoFile.size > MAX_VIDEO_SIZE_BYTES) {
        setError("حجم الفيديو أكبر من الحد المسموح (500MB).");
        return false;
      }
    }

    if (targetStep === 4 && !acceptedTerms) {
      setError("يجب الموافقة على سياسة الخصوصية وشروط الاستخدام قبل النشر.");
      return false;
    }

    return true;
  }

  function goNext() {
    setError("");
    setMessage("");
    if (!validateStep(step)) return;
    setStep((current) => Math.min(4, current + 1));
  }

  function goBack() {
    setError("");
    setMessage("");
    setStep((current) => Math.max(1, current - 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (step !== 4) {
      goNext();
      return;
    }

    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) return;

    setPending(true);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error("Supabase غير مهيأ.");

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) throw new Error("يجب تسجيل الدخول قبل رفع الفيديو.");

      setMessage("جاري تجهيز الفيديو...");
      const [duration, generatedThumb] = await withTimeout(
        Promise.all([
          getVideoDuration(videoFile),
          thumbnailFile ? Promise.resolve(null) : generateThumbnailFromVideo(videoFile),
        ]),
        45000,
        "انتهت مهلة تجهيز الفيديو. حاول بملف أصغر أو اختر صورة مصغرة يدويًا."
      );
      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        throw new Error("مدة الفيديو تتجاوز الحد المسموح (30 دقيقة).")
      }

      const effectiveThumbFile = thumbnailFile || generatedThumb;
      const now = Date.now();
      const videoPath = `${session.user.id}/${now}-${fileNameSafe(videoFile.name)}`;

      let thumbnailPath = null;
      if (effectiveThumbFile) {
        const thumbName = thumbnailFile?.name || `${fileNameSafe(videoFile.name)}.jpg`;
        thumbnailPath = `${session.user.id}/${now}-thumb-${fileNameSafe(thumbName)}`;
      }

      setMessage("جاري رفع الفيديو...");
      const uploadJobs = [
        supabase.storage.from(VIDEO_BUCKET).upload(videoPath, videoFile, {
          contentType: videoFile.type || "video/mp4",
          upsert: false,
          cacheControl: "31536000",
        }),
      ];

      if (effectiveThumbFile && thumbnailPath) {
        uploadJobs.push(
          supabase.storage.from(THUMBNAIL_BUCKET).upload(thumbnailPath, effectiveThumbFile, {
            contentType: thumbnailFile?.type || "image/jpeg",
            upsert: false,
            cacheControl: "31536000",
          })
        );
      }

      const [videoUploadResult, thumbUploadResult] = await withTimeout(
        Promise.all(uploadJobs),
        180000,
        "انتهت مهلة رفع الفيديو. تحقق من سرعة الإنترنت أو جرّب حجمًا أصغر."
      );
      if (videoUploadResult?.error) throw videoUploadResult.error;
      if (thumbUploadResult?.error) throw thumbUploadResult.error;

      const apiController = new AbortController();
      const response = await withTimeout(
        fetch("/api/videos", {
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
          signal: apiController.signal,
        }),
        45000,
        "انتهت مهلة حفظ بيانات الفيديو. حاول مرة أخرى.",
        () => apiController.abort()
      );

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "فشل حفظ بيانات الفيديو.");

      setMessage("تم رفع الفيديو بنجاح.");
      router.push(`/watch/${payload.video.id}`);
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "حدث خطأ غير متوقع.";
      if (message.toLowerCase().includes("object exceeded the maximum allowed size") || message.toLowerCase().includes("maximum allowed size")) {
        setError("حجم الفيديو أكبر من الحد المسموح في Supabase Storage bucket. ارفع حد bucket أو قلّل حجم الفيديو.");
      } else if (message.toLowerCase().includes("timed out") || message.includes("انتهت مهلة")) {
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" dir="rtl">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">رفع فيديو جديد</h1>
        <p className="text-sm text-slate-500">اتبع الخطوات الأربعة لإكمال عملية النشر.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STEPS.map((item) => {
            const active = step === item.id;
            const done = step > item.id;
            return (
              <div key={item.id} className="flex items-center gap-2 rounded-xl px-2 py-2">
                <span
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black",
                    done ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-500",
                  ].join(" ")}
                >
                  {done ? "✓" : item.id}
                </span>
                <span className={["text-xs font-bold sm:text-sm", active ? "text-slate-900" : "text-slate-500"].join(" ")}>{item.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <label className="block text-right">
            <span className="mb-1 block text-sm font-bold text-slate-700">العنوان</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="اكتب عنوانًا واضحًا للفيديو"
            />
          </label>

          <label className="block text-right">
            <span className="mb-1 block text-sm font-bold text-slate-700">الوصف</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="اكتب وصفًا مختصرًا ومفيدًا"
            />
          </label>

          <label className="block text-right">
            <span className="mb-1 block text-sm font-bold text-slate-700">الكلمات المفتاحية (مفصولة بفاصلة)</span>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="مثال: برمجة, جافاسكربت, React"
            />
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <label className="block text-right">
            <span className="mb-1 block text-sm font-bold text-slate-700">اختر تصنيف الفيديو</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2">
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          {!videoFile ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-8 sm:px-8 sm:py-10">
              <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12">
                    <path d="M12 3.75a.75.75 0 0 1 .75.75v8.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06l2.72 2.72V4.5a.75.75 0 0 1 .75-.75ZM3.75 15a.75.75 0 0 1 .75.75v1.5A2.25 2.25 0 0 0 6.75 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25v-1.5a.75.75 0 0 1 1.5 0v1.5A3.75 3.75 0 0 1 17.25 21H6.75A3.75 3.75 0 0 1 3 17.25v-1.5a.75.75 0 0 1 .75-.75Z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-black text-slate-900">تحميل الفيديوهات</h3>
                <p className="mt-3 text-base text-slate-700">يرجى سحب ملف الفيديو وإفلاته هنا، أو اختياره من جهازك.</p>
                <p className="mt-1 text-sm text-slate-500">سيبقى الفيديو خاصًا حتى تكمل خطوات النشر.</p>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  required
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="mt-6 rounded-full bg-black px-8 py-3 text-sm font-extrabold text-white transition hover:opacity-90"
                >
                  اختيار الملفات
                </button>

                <p className="mt-6 text-xs leading-6 text-slate-500">
                  عند إرسال الفيديو، فأنت توافق على{' '}
                  <a href="/terms" className="font-bold text-slate-700 hover:underline">
                    شروط الاستخدام
                  </a>{' '}
                  و{' '}
                  <a href="/privacy" className="font-bold text-slate-700 hover:underline">
                    سياسة الخصوصية
                  </a>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="block text-right">
                  <span className="mb-1 block text-sm font-bold text-slate-700">تغيير ملف الفيديو</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-300 p-2"
                  />
                  <span className="mt-2 block text-xs text-slate-500">الحد الأقصى: 500MB - المدة القصوى: 30 دقيقة.</span>
                </label>

                <label className="block text-right">
                  <span className="mb-1 block text-sm font-bold text-slate-700">الصورة المصغرة</span>
                  <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-slate-300 p-2" />
                </label>

                {thumbPreviewUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <img src={thumbPreviewUrl} alt="معاينة الصورة المصغرة" className="h-40 w-full object-cover" />
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-sm font-black text-slate-900">معاينة الفيديو</h3>
                <video src={videoPreviewUrl} controls className="aspect-video w-full rounded-xl border border-slate-200 bg-black" />
                <p className="text-xs leading-6 text-slate-600">أضف صورة مصغرة واضحة لرفع جودة ظهور الفيديو في القوائم والبحث.</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            من خلال نشر الفيديو، فأنت توافق على{' '}
            <a href="/privacy" className="font-bold text-red-700 hover:underline">
              سياسة الخصوصية
            </a>{' '}
            و{' '}
            <a href="/terms" className="font-bold text-red-700 hover:underline">
              شروط الاستخدام
            </a>
            .
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-red-700" />
            <span>أوافق على سياسة الخصوصية وشروط الاستخدام وأتحمل مسؤولية المحتوى المنشور.</span>
          </label>
        </div>
      ) : null}

      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button type="button" onClick={goBack} disabled={step === 1 || pending} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
          السابق
        </button>

        {step < 4 ? (
          <button type="button" onClick={goNext} disabled={pending} className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            التالي
          </button>
        ) : (
          <button type="submit" disabled={pending || !acceptedTerms} className="rounded-full bg-red-700 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {pending ? "جار الرفع..." : "نشر الفيديو"}
          </button>
        )}
      </div>
    </form>
  );
}







