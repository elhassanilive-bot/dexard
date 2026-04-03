"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import UploadVideoForm from "@/components/video/UploadVideoForm";

const T = {
  checking: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644...",
  required: "\u0631\u0641\u0639 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u064a\u062a\u0637\u0644\u0628 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648\u0644\u0627\u064b",
  signin: "\u0627\u0644\u0630\u0647\u0627\u0628 \u0625\u0644\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
};

export default function UploadAuthGate() {
  const router = useRouter();
  const [state, setState] = useState("checking");

  useEffect(() => {
    let alive = true;

    async function check() {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        if (alive) setState("blocked");
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!alive) return;
      if (!session) {
        setState("blocked");
        router.replace("/auth?mode=signin&next=/upload");
        return;
      }

      setState("allowed");
    }

    check();
    return () => {
      alive = false;
    };
  }, [router]);

  if (state === "checking") {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">{T.checking}</div>;
  }

  if (state === "blocked") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
        <p className="mb-4">{T.required}</p>
        <Link href="/auth?mode=signin&next=/upload" className="inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white">
          {T.signin}
        </Link>
      </div>
    );
  }

  return <UploadVideoForm />;
}