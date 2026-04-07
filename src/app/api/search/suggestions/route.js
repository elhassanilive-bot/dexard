import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/video/supabaseServer";

const HASHTAG_RE = /#([A-Za-z0-9_\u0600-\u06FF]+)/g;
const TRENDING_CACHE_TTL_MS = 60 * 1000;

let trendingCache = {
  ts: 0,
  items: [],
};

function extractHashtags(rawText) {
  const text = String(rawText || "");
  const set = new Set();
  let match;

  while ((match = HASHTAG_RE.exec(text)) !== null) {
    const tag = String(match[1] || "").trim().toLowerCase();
    if (tag) set.add(tag);
  }

  HASHTAG_RE.lastIndex = 0;
  return [...set];
}

function toHashtagItemsFromCounts(countMap) {
  return [...countMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .map((item) => ({
      id: item.tag,
      type: "hashtag",
      typeLabel: "\u0631\u0627\u0626\u062c \u0627\u0644\u064a\u0648\u0645",
      title: `#${item.tag}`,
      count: item.count,
      href: `/?q=${encodeURIComponent(`#${item.tag}`)}`,
    }));
}

function filterTrendingItems(items, queryNoHash) {
  if (!queryNoHash) return items;
  return items.filter((item) => item.id.includes(queryNoHash));
}

async function getTrendingHashtags(supabase, queryNoHash) {
  const now = Date.now();
  const normalizedQuery = String(queryNoHash || "").toLowerCase();

  if (now - trendingCache.ts < TRENDING_CACHE_TTL_MS && trendingCache.items.length > 0) {
    return filterTrendingItems(trendingCache.items, normalizedQuery);
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("videos")
    .select("id,title,description,created_at")
    .eq("status", "published")
    .gte("created_at", startOfDay.toISOString())
    .order("created_at", { ascending: false })
    .limit(1200);

  const countMap = new Map();
  for (const video of data || []) {
    const tags = new Set([...extractHashtags(video?.title), ...extractHashtags(video?.description)]);

    for (const tag of tags) {
      countMap.set(tag, (countMap.get(tag) || 0) + 1);
    }
  }

  trendingCache = {
    ts: now,
    items: toHashtagItemsFromCounts(countMap),
  };

  return filterTrendingItems(trendingCache.items, normalizedQuery);
}

export async function GET(request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ items: [] });

  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const normalizedQuery = q.replace(/^#/, "").toLowerCase();

  const trendingItems = await getTrendingHashtags(supabase, normalizedQuery);

  if (q.length < 2) {
    return NextResponse.json({ items: trendingItems.slice(0, 8) });
  }

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

  return NextResponse.json({
    items: [...trendingItems.slice(0, 4), ...videoItems, ...channelItems],
  });
}