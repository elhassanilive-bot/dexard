"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

const T = {
  home: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
  upload: "\u0631\u0641\u0639 \u0641\u064a\u062f\u064a\u0648",
  profile: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a",
  guestAccount: "\u0627\u0644\u062d\u0633\u0627\u0628",
  searchPlaceholder: "\u0627\u0628\u062d\u062b \u0639\u0646 \u0641\u064a\u062f\u064a\u0648 \u0623\u0648 \u0642\u0646\u0627\u0629",
  search: "\u0628\u062d\u062b",
};

function HomeGlyph({ active }) {
  return (
    <span
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-xl border transition",
        active ? "border-white/20 bg-white/10" : "border-slate-700 bg-slate-800/80",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M6.5 10.5V20h11V10.5" />
      </svg>
    </span>
  );
}

function UploadGlyph({ active }) {
  return (
    <span
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-xl border transition",
        active ? "border-white/20 bg-white/10" : "border-slate-700 bg-slate-800/80",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
        <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
        <path d="M11 10v5" />
        <path d="m8.8 12.2 2.2-2.2 2.2 2.2" />
      </svg>
    </span>
  );
}

function NavLink({ href, active, icon, children }) {
  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-extrabold transition",
        active
          ? "border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-[0_10px_26px_-15px_rgba(15,23,42,0.9)]"
          : "border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-500 hover:bg-slate-800 hover:text-white",
      ].join(" ")}
    >
      {icon}
      {children}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") || "");
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    async function syncAvatar(supabase, user) {
      if (!user) {
        if (mounted) setAvatarUrl("");
        return;
      }
      const fallbackAvatar = user.user_metadata?.avatar_url || "";
      const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
      if (mounted) setAvatarUrl(profile?.avatar_url || fallbackAvatar || "");
    }

    async function bindAuth() {
      if (!isSupabaseConfigured()) return;
      const supabase = await getSupabaseClient();
      if (!supabase || !mounted) return;

      const { data } = await supabase.auth.getSession();
      if (mounted) setAuthUser(data?.session?.user || null);
      await syncAvatar(supabase, data?.session?.user || null);

      const state = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) setAuthUser(session?.user || null);
        syncAvatar(supabase, session?.user || null);
      });

      return () => state.data.subscription.unsubscribe();
    }

    const cleanup = bindAuth();
    return () => {
      mounted = false;
      Promise.resolve(cleanup).then((fn) => fn && fn());
    };
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(term)}`);
        if (!response.ok) return;
        const payload = await response.json();
        setSuggestions(Array.isArray(payload?.items) ? payload.items.slice(0, 6) : []);
      } catch {
        setSuggestions([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [q]);

  const initials = useMemo(() => {
    const source = authUser?.user_metadata?.display_name || authUser?.email || "U";
    return String(source).trim().slice(0, 1).toUpperCase();
  }, [authUser]);

  function submitSearch(event) {
    event.preventDefault();
    const term = q.trim();
    if (!term) {
      router.push("/");
      return;
    }
    router.push(`/?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink href="/" active={pathname === "/"} icon={<HomeGlyph active={pathname === "/"} />}>
              {T.home}
            </NavLink>
            <NavLink href="/upload" active={pathname.startsWith("/upload")} icon={<UploadGlyph active={pathname.startsWith("/upload")} />}>
              {T.upload}
            </NavLink>
          </nav>

          {authUser ? (
            <Link
              href="/account"
              aria-label={T.profile}
              title={T.profile}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-900 text-sm font-black text-white shadow-sm ring-2 ring-white transition hover:scale-[1.03]"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={T.profile} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </Link>
          ) : (
            <Link
              href="/auth"
              aria-label={T.guestAccount}
              title={T.guestAccount}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-slate-900 text-white shadow-sm ring-2 ring-white transition hover:scale-[1.03]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20a8 8 0 0 1 16 0" />
              </svg>
            </Link>
          )}
        </div>

        <form onSubmit={submitSearch} className="relative mr-auto w-full max-w-3xl">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={T.searchPlaceholder}
            className="h-12 w-full rounded-full border border-slate-300/80 bg-white px-5 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
          />
          <button type="submit" className="absolute left-1.5 top-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">
            {T.search}
          </button>

          {suggestions.length > 0 && q.trim().length >= 2 ? (
            <div className="absolute right-0 top-14 w-full max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {suggestions.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 last:border-b-0"
                >
                  <span className="font-bold text-slate-900">{item.title}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{item.typeLabel}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </form>
      </div>
    </header>
  );
}
