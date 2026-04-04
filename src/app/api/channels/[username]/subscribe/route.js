import { NextResponse } from "next/server";
import { getAccessTokenFromRequest, getAuthUserFromRequest, getSupabaseServerClient } from "@/lib/video/supabaseServer";

export async function GET(request, { params }) {
  const token = getAccessTokenFromRequest(request);
  const supabase = getSupabaseServerClient(token || undefined);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { username } = await params;
  const { data: channel, error: channelError } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (channelError) return NextResponse.json({ error: channelError.message }, { status: 500 });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const { count } = await supabase.from("subscriptions").select("subscriber_id", { count: "exact", head: true }).eq("channel_id", channel.id);

  let subscribed = false;
  let isOwner = false;

  if (token) {
    const { data } = await supabase.auth.getUser(token);
    const user = data?.user || null;
    if (user) {
      isOwner = user.id === channel.id;
      if (!isOwner) {
        const { data: exists } = await supabase
          .from("subscriptions")
          .select("subscriber_id")
          .eq("channel_id", channel.id)
          .eq("subscriber_id", user.id)
          .maybeSingle();
        subscribed = Boolean(exists);
      }
    }
  }

  return NextResponse.json({ subscribed, subscribers_count: count || 0, is_owner: isOwner });
}

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const { data: channel, error: channelError } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (channelError) return NextResponse.json({ error: channelError.message }, { status: 500 });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  if (channel.id === user.id) return NextResponse.json({ error: "Cannot subscribe to your own channel" }, { status: 400 });

  const { data: exists, error: existsError } = await supabase
    .from("subscriptions")
    .select("subscriber_id")
    .eq("channel_id", channel.id)
    .eq("subscriber_id", user.id)
    .maybeSingle();

  if (existsError) return NextResponse.json({ error: existsError.message }, { status: 500 });

  let subscribed = false;
  if (exists) {
    const { error: deleteError } = await supabase.from("subscriptions").delete().eq("channel_id", channel.id).eq("subscriber_id", user.id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    subscribed = false;
  } else {
    const { error: insertError } = await supabase.from("subscriptions").insert({ channel_id: channel.id, subscriber_id: user.id });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    subscribed = true;
  }

  const { count } = await supabase.from("subscriptions").select("subscriber_id", { count: "exact", head: true }).eq("channel_id", channel.id);
  return NextResponse.json({ subscribed, subscribers_count: count || 0 });
}
