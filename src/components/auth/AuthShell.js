"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { slugifyUsername } from "@/lib/video/format";

const T = {
  signin: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
  signup: "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628",
  forgot: "\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
  title: "\u0628\u0648\u0627\u0628\u0629 \u062d\u0633\u0627\u0628\u0643",
  subtitle: "\u0623\u062f\u0631 \u0642\u0646\u0627\u062a\u0643\u060c \u0627\u0646\u0634\u0631 \u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a\u0643\u060c \u0648\u0627\u0628\u0646\u064a \u0645\u062c\u062a\u0645\u0639\u0643 \u0639\u0644\u0649 Dexard Video",
  pointOne: "\u062d\u0633\u0627\u0628 \u0642\u0646\u0627\u0629 \u0628\u0627\u0633\u0645 \u0645\u0633\u062a\u062e\u062f\u0645 \u0641\u0631\u064a\u062f",
  pointTwo: "\u062a\u0641\u0627\u0639\u0644 \u0645\u0628\u0627\u0634\u0631 \u0645\u0639 \u0627\u0644\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0648\u0627\u0644\u0642\u0646\u0648\u0627\u062a",
  pointThree: "\u062d\u0645\u0627\u064a\u0629 \u0622\u0645\u0646\u0629 \u0648\u0625\u062f\u0627\u0631\u0629 \u0645\u0631\u0646\u0629 \u0644\u0644\u062d\u0633\u0627\u0628",
  supabaseMissing: "\u0644\u0645 \u064a\u062a\u0645 \u0625\u0639\u062f\u0627\u062f Supabase \u0628\u0639\u062f",
  accountCreated: "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062d\u0633\u0627\u0628\u060c \u0631\u0627\u062c\u0639 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u062b\u0645 \u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
  resetSent: "\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637 \u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0625\u0644\u0649 \u0628\u0631\u064a\u062f\u0643",
  unexpected: "\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639",
  displayName: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0638\u0627\u0647\u0631",
  username: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0641\u0631\u064a\u062f",
  usernamePlaceholder: "\u0645\u062b\u0627\u0644: dexard_tv",
  email: "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
  password: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
  submit: "\u062a\u0623\u0643\u064a\u062f",
  pending: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0646\u0641\u064a\u0630...",
  accountSettingsHint: "\u0628\u0639\u062f \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u064a\u0645\u0643\u0646\u0643 \u062a\u0639\u062f\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a\u0643 \u0645\u0646",
  accountSettings: "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628",
};

function ModeButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-extrabold transition",
        active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function AuthShell({ initialMode = "signin" }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const currentTitle = useMemo(() => {
    if (mode === "signup") return T.signup;
    if (mode === "forgot") return T.forgot;
    return T.signin;
  }, [mode]);

  if (!isSupabaseConfigured()) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-red-700">{T.supabaseMissing}</div>;
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error("Supabase unavailable");

      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push("/");
        router.refresh();
      } else if (mode === "signup") {
        const cleanUsername = slugifyUsername(username || displayName || email.split("@")[0]);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, username: cleanUsername },
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined,
          },
        });
        if (signUpError) throw signUpError;

        if (data?.user) {
          const { error: profileError } = await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              username: cleanUsername || `user_${data.user.id.slice(0, 8)}`,
              display_name: displayName || cleanUsername,
              email,
            },
            { onConflict: "id" }
          );
          if (profileError) throw profileError;
        }

        setMessage(T.accountCreated);
        setMode("signin");
      } else if (mode === "forgot") {
        const { error: forgotError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined,
        });
        if (forgotError) throw forgotError;
        setMessage(T.resetSent);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : T.unexpected);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_90px_-45px_rgba(15,23,42,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative bg-gradient-to-bl from-slate-950 via-slate-900 to-red-700 p-8 text-white sm:p-10">
          <div className="absolute -left-16 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="relative text-right">
            <div className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-bold">DEXARD VIDEO</div>
            <h1 className="mt-5 text-3xl font-black leading-[1.5] sm:text-4xl">{T.title}</h1>
            <p className="mt-4 text-sm leading-8 text-white/90">{T.subtitle}</p>
            <ul className="mt-7 space-y-2 text-sm text-white/90">
              <li>• {T.pointOne}</li>
              <li>• {T.pointTwo}</li>
              <li>• {T.pointThree}</li>
            </ul>
          </div>
        </div>

        <div className="p-6 text-right sm:p-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <ModeButton active={mode === "signin"} onClick={() => setMode("signin")}>{T.signin}</ModeButton>
            <ModeButton active={mode === "signup"} onClick={() => setMode("signup")}>{T.signup}</ModeButton>
            <ModeButton active={mode === "forgot"} onClick={() => setMode("forgot")}>{T.forgot}</ModeButton>
          </div>

          <h2 className="text-2xl font-black text-slate-900">{currentTitle}</h2>

          {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
          {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "signup" ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-600">{T.displayName}</span>
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-red-300" />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-600">{T.username}</span>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={T.usernamePlaceholder} required className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-red-300" />
                </label>
              </>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">{T.email}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-red-300" />
            </label>

            {mode !== "forgot" ? (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">{T.password}</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-red-300" />
              </label>
            ) : null}

            <button type="submit" disabled={pending} className="inline-flex min-w-[170px] items-center justify-center rounded-full bg-red-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-800/25 transition hover:bg-red-800 disabled:opacity-70">
              {pending ? T.pending : T.submit}
            </button>
          </form>

          <p className="mt-5 text-xs text-slate-500">
            {T.accountSettingsHint} <Link href="/account" className="font-bold text-red-700">{T.accountSettings}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}