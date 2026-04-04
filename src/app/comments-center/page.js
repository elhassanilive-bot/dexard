"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

const FILTERS = [
  { id: "all", label: "الكل" },
  { id: "top", label: "تعليقات رئيسية" },
  { id: "replies", label: "ردود" },
];

const SORTS = [
  { id: "latest", label: "الأحدث" },
  { id: "oldest", label: "الأقدم" },
  { id: "most_liked", label: "الأكثر إعجابًا" },
];

export default function CommentsCenterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) throw new Error("Supabase غير مهيأ");
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token || "";
        if (!token) {
          router.push("/auth");
          return;
        }

        const response = await fetch("/api/me/comments", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "تعذر تحميل التعليقات");
        }

        const payload = await response.json();
        if (!alive) return;
        setItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل التعليقات");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  const visible = useMemo(() => {
    let list = [...items];

    if (filter === "top") list = list.filter((item) => !item.parent_id);
    if (filter === "replies") list = list.filter((item) => Boolean(item.parent_id));

    if (sort === "latest") {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "oldest") {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      list.sort((a, b) => Number(b.likes_count || 0) - Number(a.likes_count || 0));
    }

    return list;
  }, [items, filter, sort]);

  return (
    <section className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-right text-3xl font-black text-slate-900">مركز التعليقات</h1>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{visible.length}</span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              filter === f.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSort(s.id)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              sort === s.id ? "border-red-700 bg-red-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-right text-sm text-slate-500">جاري التحميل...</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-right text-sm text-rose-700">{error}</p> : null}
      {!loading && !error && visible.length === 0 ? <p className="text-right text-sm text-slate-500">لا توجد تعليقات في هذا القسم</p> : null}

      {visible.length > 0 ? (
        <div className="space-y-2">
          {visible.map((item) => (
            <Link key={item.id} href={`/watch/${item.video_id}`} className="block rounded-2xl border border-slate-200 bg-white p-3 transition hover:shadow-sm">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500">{item.video_title}</p>
                <p className="mt-1 text-sm text-slate-900">{item.body}</p>
                <div className="mt-2 flex items-center justify-end gap-3 text-[11px] text-slate-500">
                  <span>ردود {item.replies_count}</span>
                  <span>❤️ {item.likes_count}</span>
                  <span>👎 {item.dislikes_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
