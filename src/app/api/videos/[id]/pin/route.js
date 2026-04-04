import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

export async function GET(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from("videos")
    .select("id,is_pinned,pinned_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  return NextResponse.json({ pinned: Boolean(data.is_pinned), pinned_at: data.pinned_at || null });
}

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const { data: current, error: currentError } = await supabase
    .from("videos")
    .select("id,is_pinned")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const nextPinned = typeof body?.pinned === "boolean" ? body.pinned : !Boolean(current.is_pinned);

  const payload = nextPinned
    ? { is_pinned: true, pinned_at: new Date().toISOString() }
    : { is_pinned: false, pinned_at: null };

  const { data: updated, error: updateError } = await supabase
    .from("videos")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,is_pinned,pinned_at")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ pinned: Boolean(updated.is_pinned), pinned_at: updated.pinned_at || null });
}
