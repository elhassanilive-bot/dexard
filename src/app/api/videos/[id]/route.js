import { NextResponse } from "next/server";
import { getAuthUserFromRequest, getSupabaseServerClient } from "@/lib/video/supabaseServer";

export async function GET(_request, { params }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;
  const { data, error } = await supabase
    .from("videos")
    .select("id,title,description,keywords,category,duration_sec,views_count,likes_count,dislikes_count,comments_count,created_at,video_path,thumbnail_path,user_id,channel:profiles!videos_user_id_fkey(id,username,display_name,avatar_url)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data || null });
}

export async function PATCH(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const title = String(body?.title || "").trim();
  if (!title || title.length < 3) return NextResponse.json({ error: "Title is too short" }, { status: 400 });

  const updateFields = {
    title,
    description: String(body?.description || "").trim(),
    category: body?.category ? String(body.category).trim().slice(0, 40) : undefined,
    keywords: Array.isArray(body?.keywords) ? body.keywords.slice(0, 20).map((v) => String(v).trim()).filter(Boolean) : undefined,
  };

  Object.keys(updateFields).forEach((k) => updateFields[k] === undefined && delete updateFields[k]);

  const { data, error } = await supabase
    .from("videos")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,title,description,keywords,category")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  return NextResponse.json({ item: data });
}

export async function DELETE(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase.from("videos").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
