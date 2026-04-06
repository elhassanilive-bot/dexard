import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

const ALLOWED_REASONS = new Set(["spam", "violence", "hate", "harassment", "sexual", "copyright", "misleading", "other"]);

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = String(body?.reason || "other").trim().toLowerCase();
  const details = String(body?.details || "").trim();

  const { error } = await supabase.from("video_reports").insert({
    reporter_id: user.id,
    video_id: id,
    reason: ALLOWED_REASONS.has(reason) ? reason : "other",
    details: details ? details.slice(0, 2000) : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reported: true });
}
