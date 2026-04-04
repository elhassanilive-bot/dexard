"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

const FILTERS = [
  { id: "all", label: "الكل" },
  { id: "subscriber", label: "اشتراكات" },
  { id: "comment", label: "تعليقات" },
  { id: "reply", label: "ردود" },
  { id: "reaction", label: "تفاعلات" },
  { id: "save", label: "حفظ" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [token, setToken] = useState("");
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
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

        const response = await fetch("/api/me/notifications", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "تعذر تحميل الإشعارات");
        }

        const payload = await response.json();
        if (!alive) return;
        setItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الإشعارات");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  async function markAllAsRead() {
    if (!token || markingAllRead || unreadCount === 0) return;

    setMarkingAllRead(true);
    try {
      const response = await fetch("/api/me/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const nowIso = new Date().toISOString();
      setItems((prev) => prev.map((item) => (item.read_at ? item : { ...item, read_at: nowIso })));
    } finally {
      setMarkingAllRead(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-right text-3xl font-black text-slate-900">الإشعارات</h1>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{filtered.length}</span>
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">غير مقروء {unreadCount}</span>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAllRead || unreadCount === 0}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAllRead ? "جاري التحديث..." : "تحديد الكل كمقروء"}
          </button>
        </div>
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

      {loading ? <p className="text-right text-sm text-slate-500">جاري التحميل...</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-right text-sm text-rose-700">{error}</p> : null}
      {!loading && !error && filtered.length === 0 ? <p className="text-right text-sm text-slate-500">لا توجد إشعارات في هذا القسم</p> : null}

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((item, index) => (
            <Link
              key={`${item.id}-${index}`}
              href={item.href || "#"}
              className={[
                "block rounded-2xl border p-3 transition hover:shadow-sm",
                item.read_at ? "border-slate-200 bg-white" : "border-sky-200 bg-sky-50/50",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {item.actor?.avatar_url ? <img src={item.actor.avatar_url} alt={item.actor.display_name || item.actor.username || "user"} className="h-full w-full object-cover" /> : null}
                </span>
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    {!item.read_at ? <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" /> : null}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{new Date(item.created_at).toLocaleString("ar")}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
