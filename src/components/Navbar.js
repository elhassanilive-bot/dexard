"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

const T = {
  home: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
  upload: "\u0631\u0641\u0639 \u0641\u064a\u062f\u064a\u0648",
  signin: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
  signup: "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628",
  logout: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c",
  searchPlaceholder: "\u0627\u0628\u062d\u062b \u0639\u0646 \u0641\u064a\u062f\u064a\u0648 \u0623\u0648 \u0642\u0646\u0627\u0629",
  search: "\u0628\u062d\u062b",
};

function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-2 text-sm font-extrabold transition",
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") || "");
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    async function bindAuth() {
      if (!isSupabaseConfigured()) return;
      const supabase = await getSupabaseClient();
      if (!supabase || !mounted) return;

      const { data } = await supabase.auth.getSession();
      if (mounted) setAuthUser(data?.session?.user || null);

      const state = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) setAuthUser(session?.user || null);
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

  async function handleLogout() {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

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
        <Link href="/" className="shrink-0 rounded-2xl bg-gradient-to-l from-red-700 to-slate-900 px-4 py-2 text-sm font-black text-white shadow-lg shadow-red-900/20">
          Dexard Video
        </Link>

        <form onSubmit={submitSearch} className="relative flex-1">
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
            <div className="absolute right-0 top-14 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
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

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink href="/" active={pathname === "/"}>{T.home}</NavLink>
          <NavLink href="/upload" active={pathname.startsWith("/upload")}>{T.upload}</NavLink>
        </nav>

        {authUser ? (
          <div className="flex items-center gap-2">
            <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
              {initials}
            </Link>
            <button onClick={handleLogout} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">
              {T.logout}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth" className="rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">
              {T.signin}
            </Link>
            <Link href="/auth?mode=signup" className="rounded-full bg-red-700 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/20">
              {T.signup}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}