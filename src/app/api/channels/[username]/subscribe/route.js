import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/video/supabaseServer";

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const { data: channel, error: channelError } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (channelError) return NextResponse.json({ error: channelError.message }, { status: 500 });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const { data: exists } = await supabase.from("subscriptions").select("subscriber_id").eq("channel_id", channel.id).eq("subscriber_id", user.id).maybeSingle();

  let subscribed = false;
  if (exists) {
    await supabase.from("subscriptions").delete().eq("channel_id", channel.id).eq("subscriber_id", user.id);
    subscribed = false;
  } else {
    await supabase.from("subscriptions").insert({ channel_id: channel.id, subscriber_id: user.id });
    subscribed = true;
  }

  const { count } = await supabase.from("subscriptions").select("subscriber_id", { count: "exact", head: true }).eq("channel_id", channel.id);
  return NextResponse.json({ subscribed, subscribers_count: count || 0 });
}