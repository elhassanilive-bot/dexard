"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const T = {
  menu: "القائمة",
  close: "إغلاق",
  account: "الحساب",
  signIn: "تسجيل الدخول",
  myChannel: "قناتي",
  myVideos: "مقاطعك",
  saved: "المحفوظات",
  subscriptions: "الاشتراكات",
  history: "السجل",
  engagement: "التفاعلات",
  downloads: "التنزيلات",
  notifications: "الإشعارات",
  commentsCenter: "مركز التعليقات",
  settings: "الإعدادات والأمان",
  support: "الدعم والإبلاغ",
};

function MenuItemIcon({ name }) {
  const cls = "h-5 w-5 text-black";

  if (name === "my_channel") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="M12 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm-9 18a9 9 0 1 1 18 0H3Z" />
      </svg>
    );
  }

  if (name === "my_videos") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5v-11Zm16.5 1.5L18 9.8v4.4l2.5 1.8a1 1 0 0 0 1.5-.82V8.82A1 1 0 0 0 20.5 8Z" />
      </svg>
    );
  }

  if (name === "saved") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.2L6 21V4.75Z" />
      </svg>
    );
  }

  if (name === "subscriptions") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm10 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2.5 20a4.5 4.5 0 0 1 9 0m3 0a4.5 4.5 0 0 1 7 0" />
      </svg>
    );
  }

  if (name === "history") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 0 2.34-5.66M4 5v4h4m4-3v6l4 2" />
      </svg>
    );
  }

  if (name === "engagement") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="m12 21-.4-.22C6.1 17.7 3 14.9 3 10.9 3 8.2 5 6 7.7 6c1.8 0 3.3 1 4.3 2.4C13 7 14.5 6 16.3 6 19 6 21 8.2 21 10.9c0 4-3.1 6.8-8.6 9.88L12 21Z" />
      </svg>
    );
  }

  if (name === "downloads") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" />
      </svg>
    );
  }

  if (name === "notifications") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" clipRule="evenodd" />
      </svg>
    );
  }

  if (name === "comments_center") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4.5 4V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m10.3 2.8 1.4-.8 1.4.8.4 1.6a7.9 7.9 0 0 1 1.6.9l1.6-.5 1 1.3-.8 1.5c.3.5.5 1.1.6 1.7l1.5.8v1.6l-1.5.8c-.1.6-.3 1.2-.6 1.7l.8 1.5-1 1.3-1.6-.5a7.9 7.9 0 0 1-1.6.9l-.4 1.6-1.4.8-1.4-.8-.4-1.6a7.9 7.9 0 0 1-1.6-.9l-1.6.5-1-1.3.8-1.5a7 7 0 0 1-.6-1.7L3 12v-1.6l1.5-.8c.1-.6.3-1.2.6-1.7l-.8-1.5 1-1.3 1.6.5c.5-.4 1-.7 1.6-.9l.4-1.6ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      </svg>
    );
  }

  if (name === "support") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9a3 3 0 1 1 6 0c0 2-3 2-3 4m.01 3h.01M4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z" />
      </svg>
    );
  }

  if (name === "signin") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5m5 5H4" />
      </svg>
    );
  }

  return null;
}

function rowClass(active) {
  return [
    "flex flex-row-reverse items-center justify-end gap-3 rounded-xl px-3 py-2.5 text-right text-sm font-semibold transition",
    active ? "border-r-2 border-slate-950 text-slate-950" : "text-slate-700 hover:text-slate-950",
  ].join(" ");
}

export default function SideMenuDrawer({ open, onClose, isAuthed, profileUsername, avatarUrl, initials }) {
  const pathname = usePathname();

  const channelHref = profileUsername ? `/channel/${profileUsername}` : "/account";

  const guestItems = [
    { href: "/auth", label: T.signIn, icon: "signin" },
    { href: "/support", label: T.support, icon: "support" },
  ];

  const userItems = [
    { href: channelHref, label: T.myChannel, icon: "my_channel" },
    { href: "/my-videos", label: T.myVideos, icon: "my_videos" },
    { href: "/saved", label: T.saved, icon: "saved" },
    { href: "/subscriptions", label: T.subscriptions, icon: "subscriptions" },
    { href: "/history", label: T.history, icon: "history" },
    { href: "/engagement", label: T.engagement, icon: "engagement" },
    { href: "/downloads", label: T.downloads, icon: "downloads" },
    { href: "/notifications", label: T.notifications, icon: "notifications" },
    { href: "/comments-center", label: T.commentsCenter, icon: "comments_center" },
    { href: "/settings", label: T.settings, icon: "settings" },
    { href: "/support", label: T.support, icon: "support" },
  ];

  const items = isAuthed ? userItems : guestItems;

  return (
    <>
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-[70] bg-black/30 transition-opacity",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed right-0 top-0 z-[80] h-screen w-[86vw] max-w-sm border-l border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-hidden={!open}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">{T.menu}</h2>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold text-slate-700">
            {T.close}
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {isAuthed ? (
            <Link href="/account" onClick={onClose} className="flex flex-row-reverse items-center justify-end gap-3 text-right">
              <span className="text-sm font-semibold text-slate-800">{T.account}</span>
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-black text-slate-800">
                {avatarUrl ? <img src={avatarUrl} alt={T.account} className="h-full w-full object-cover" /> : initials}
              </span>
            </Link>
          ) : (
            <Link href="/auth" onClick={onClose} className="text-sm font-semibold text-slate-700">
              {T.signIn}
            </Link>
          )}
        </div>

        <nav className="space-y-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose} className={rowClass(pathname === item.href)}>
              <span>{item.label}</span>
              <MenuItemIcon name={item.icon} />
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
