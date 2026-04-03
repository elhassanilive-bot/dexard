"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

const T = {
  menu: "\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  home: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
  upload: "\u0631\u0641\u0639 \u0641\u064a\u062f\u064a\u0648",
  profile: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a",
  guestAccount: "\u0627\u0644\u062d\u0633\u0627\u0628",
  searchPlaceholder: "\u0627\u0628\u062d\u062b \u0639\u0646 \u0641\u064a\u062f\u064a\u0648 \u0623\u0648 \u0642\u0646\u0627\u0629",
  search: "\u0628\u062d\u062b",
};

function HomeGlyph({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={["h-6 w-6", active ? "text-slate-950" : "text-slate-700"].join(" ")}>
      <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
      <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  );
}

function MenuGlyph({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={["h-6 w-6", active ? "text-slate-950" : "text-slate-700"].join(" ")}>
      <path
        fillRule="evenodd"
        d="M3 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.25Zm0 4.5A.75.75 0 0 1 3.75 9h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 9.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function UploadGlyph({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={["h-6 w-6", active ? "text-slate-950" : "text-slate-700"].join(" ")}>
      <path d="M9.97.97a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06l-1.72-1.72v3.44h-1.5V3.31L8.03 5.03a.75.75 0 0 1-1.06-1.06l3-3ZM9.75 6.75v6a.75.75 0 0 0 1.5 0v-6h3a3 3 0 0 1 3 3v7.5a3 3 0 0 1-3 3h-7.5a3 3 0 0 1-3-3v-7.5a3 3 0 0 1 3-3h3Z" />
      <path d="M7.151 21.75a2.999 2.999 0 0 0 2.599 1.5h7.5a3 3 0 0 0 3-3v-7.5c0-1.11-.603-2.08-1.5-2.599v7.099a4.5 4.5 0 0 1-4.5 4.5H7.151Z" />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M8.25 10.875a2.625 2.625 0 1 1 5.25 0 2.625 2.625 0 0 1-5.25 0Z" />
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.125 4.5a4.125 4.125 0 1 0 2.338 7.524l2.007 2.006a.75.75 0 1 0 1.06-1.06l-2.006-2.007a4.125 4.125 0 0 0-3.399-6.463Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconWithLabel({ href, label, ariaLabel, title, children }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={title}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 px-1"
    >
      {children}
      <span className="text-[10px] font-medium leading-none tracking-tight text-slate-500">{label}</span>
    </Link>
  );
}

function IconButtonWithLabel({ label, ariaLabel, title, onClick, children }) {
  return (
    <button type="button" aria-label={ariaLabel} title={title} onClick={onClick} className="inline-flex shrink-0 items-center justify-center gap-1.5 px-1">
      {children}
      <span className="text-[10px] font-medium leading-none tracking-tight text-slate-500">{label}</span>
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") || "");
    setMobileSearchOpen(false);
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
      setMobileSearchOpen(false);
      return;
    }
    router.push(`/?q=${encodeURIComponent(term)}`);
    setMobileSearchOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
        <div className="hidden items-center gap-4 lg:flex">
          <nav className="flex shrink-0 items-center gap-3">
            <IconButtonWithLabel label={T.menu} ariaLabel={T.menu} title={T.menu} onClick={() => {}}>
              <MenuGlyph active={false} />
            </IconButtonWithLabel>
            <IconWithLabel href="/" label={T.home} ariaLabel={T.home} title={T.home}>
              <HomeGlyph active={pathname === "/"} />
            </IconWithLabel>
            <IconWithLabel href="/upload" label={T.upload} ariaLabel={T.upload} title={T.upload}>
              <UploadGlyph active={pathname.startsWith("/upload")} />
            </IconWithLabel>
            {authUser ? (
              <IconWithLabel href="/account" label={T.guestAccount} ariaLabel={T.profile} title={T.profile}>
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-[10px] font-black text-slate-900">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={T.profile} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </span>
              </IconWithLabel>
            ) : (
              <IconWithLabel href="/auth" label={T.guestAccount} ariaLabel={T.guestAccount} title={T.guestAccount}>
                <span className="inline-flex h-7 w-7 items-center justify-center text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path
                      fillRule="evenodd"
                      d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </IconWithLabel>
            )}
          </nav>

          <form onSubmit={submitSearch} className="relative mr-auto w-full max-w-4xl">
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
              <div className="absolute right-0 top-14 z-10 w-full max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
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

        <div className="space-y-2 lg:hidden">
          {mobileSearchOpen ? (
            <form onSubmit={submitSearch} className="relative w-full">
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={T.searchPlaceholder}
                className="h-11 w-full rounded-full border border-slate-300/80 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
              />
              <button type="submit" className="absolute left-1.5 top-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                {T.search}
              </button>
              {suggestions.length > 0 && q.trim().length >= 2 ? (
                <div className="absolute right-0 top-12 z-10 w-full max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  {suggestions.map((item) => (
                    <Link
                      key={`m-${item.type}-${item.id}`}
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
          ) : null}

          <div className="flex items-center gap-2">
            <nav className="flex flex-1 items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <IconButtonWithLabel label={T.menu} ariaLabel={T.menu} title={T.menu} onClick={() => {}}>
                <MenuGlyph active={false} />
              </IconButtonWithLabel>
              <IconWithLabel href="/" label={T.home} ariaLabel={T.home} title={T.home}>
                <HomeGlyph active={pathname === "/"} />
              </IconWithLabel>
              <IconWithLabel href="/upload" label={T.upload} ariaLabel={T.upload} title={T.upload}>
                <UploadGlyph active={pathname.startsWith("/upload")} />
              </IconWithLabel>

              {authUser ? (
                <IconWithLabel href="/account" label={T.guestAccount} ariaLabel={T.profile} title={T.profile}>
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-[10px] font-black text-slate-900">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={T.profile} className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                </IconWithLabel>
              ) : (
                <IconWithLabel href="/auth" label={T.guestAccount} ariaLabel={T.guestAccount} title={T.guestAccount}>
                  <span className="inline-flex h-7 w-7 items-center justify-center text-slate-900">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path
                        fillRule="evenodd"
                        d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </IconWithLabel>
              )}
            </nav>

            <button
              type="button"
              aria-label={T.search}
              title={T.search}
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800"
            >
              <SearchGlyph />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
