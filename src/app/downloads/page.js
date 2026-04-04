/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "dexard_downloads";

export default function DownloadsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  function clearAll() {
    localStorage.removeItem(KEY);
    setItems([]);
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-right text-3xl font-black text-slate-900">التنزيلات</h1>
        {items.length > 0 ? (
          <button type="button" onClick={clearAll} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">مسح الكل</button>
        ) : null}
      </div>

      {items.length === 0 ? <p className="text-right text-sm text-slate-500">لا توجد تنزيلات محلية بعد</p> : null}

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{item.filename || "video.mp4"}</p>
                <p className="text-xs text-slate-500">{new Date(item.downloaded_at).toLocaleString("ar")}</p>
              </div>
              <Link href={`/watch/${item.video_id}`} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">فتح الفيديو</Link>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}


