"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function SubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

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

        const response = await fetch("/api/me/subscriptions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "تعذر تحميل الاشتراكات");
        }

        const payload = await response.json();
        if (!alive) return;
        setItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الاشتراكات");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <section className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-right text-3xl font-black text-slate-900">الاشتراكات</h1>
      {loading ? <p className="text-right text-sm text-slate-500">جاري التحميل...</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-right text-sm text-rose-700">{error}</p> : null}
      {!loading && !error && items.length === 0 ? <p className="text-right text-sm text-slate-500">لا توجد اشتراكات حتى الآن</p> : null}

      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <Link key={item.id} href={`/channel/${item.username}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                {item.avatar_url ? <img src={item.avatar_url} alt={item.display_name || item.username} className="h-full w-full object-cover" /> : null}
              </span>
              <span className="min-w-0 flex-1 text-right">
                <span className="block truncate text-sm font-bold text-slate-900">{item.display_name || item.username}</span>
                <span className="block truncate text-xs text-slate-500" dir="ltr">@{item.username}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}



