"use client";

export default function NewsTickerClient() {
  return (
    <div className="overflow-hidden rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 shadow-[0_10px_30px_-18px_rgba(239,68,68,0.55)]">
      <div className="flex items-center gap-3">
        <span className="shrink-0 rounded-full bg-red-700 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.14em] text-white">
          تنويه
        </span>
        <div className="news-alert-marquee whitespace-nowrap text-sm font-bold leading-6 text-white">
          شكرًا لجميع الناشرين والمساهمين الذين يثقون بنا، فبتعاونكم نصنع الإبداع ونبني محتوى غنيًا بالمعلومة والمعرفة.
        </div>
      </div>
    </div>
  );
}
