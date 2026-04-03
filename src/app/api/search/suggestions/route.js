import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/video/supabaseServer";

export async function GET(request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ items: [] });

  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ items: [] });

  const [videoResult, channelResult] = await Promise.all([
    supabase.from("videos").select("id,title").eq("status", "published").ilike("title", `%${q}%`).limit(4),
    supabase.from("profiles").select("id,username,display_name").or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(3),
  ]);

  const videoItems = (videoResult.data || []).map((item) => ({
    id: item.id,
    type: "video",
    typeLabel: "\u0641\u064a\u062f\u064a\u0648",
    title: item.title,
    href: `/watch/${item.id}`,
  }));

  const channelItems = (channelResult.data || []).map((item) => ({
    id: item.id,
    type: "channel",
    typeLabel: "\u0642\u0646\u0627\u0629",
    title: item.display_name || item.username,
    href: `/channel/${item.username}`,
  }));

  return NextResponse.json({ items: [...videoItems, ...channelItems] });
}