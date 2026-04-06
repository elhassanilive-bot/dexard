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

  if (!token) return NextResponse.json({ blocked: false, is_owner: false });

  const { data } = await supabase.auth.getUser(token);
  const user = data?.user || null;
  if (!user) return NextResponse.json({ blocked: false, is_owner: false });

  const isOwner = user.id === channel.id;
  if (isOwner) return NextResponse.json({ blocked: false, is_owner: true });

  const { data: exists, error } = await supabase
    .from("blocked_channels")
    .select("blocked_channel_id")
    .eq("blocker_id", user.id)
    .eq("blocked_channel_id", channel.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blocked: Boolean(exists), is_owner: false });
}

export async function POST(request, { params }) {
  const { supabase, user } = await getAuthUserFromRequest(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const { data: channel, error: channelError } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (channelError) return NextResponse.json({ error: channelError.message }, { status: 500 });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  if (channel.id === user.id) return NextResponse.json({ error: "Cannot block your own channel" }, { status: 400 });

  const { data: exists, error: existsError } = await supabase
    .from("blocked_channels")
    .select("blocked_channel_id")
    .eq("blocker_id", user.id)
    .eq("blocked_channel_id", channel.id)
    .maybeSingle();

  if (existsError) return NextResponse.json({ error: existsError.message }, { status: 500 });

  let blocked = false;
  if (exists) {
    const { error } = await supabase.from("blocked_channels").delete().eq("blocker_id", user.id).eq("blocked_channel_id", channel.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    blocked = false;
  } else {
    const { error } = await supabase.from("blocked_channels").insert({ blocker_id: user.id, blocked_channel_id: channel.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    blocked = true;
  }

  return NextResponse.json({ blocked });
}
