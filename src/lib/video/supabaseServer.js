import { createClient } from "@supabase/supabase-js";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anon };
}

export function getSupabaseServerClient(accessToken) {
  const { url, anon } = getEnv();
  if (!url || !anon) return null;

  const dbSchema = process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA || process.env.SUPABASE_DB_SCHEMA || 'public';
  return createClient(url, anon, {
    auth: { persistSession: false },
    db: { schema: dbSchema },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export function getAccessTokenFromRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7).trim();
}

export async function getAuthUserFromRequest(request) {
  const token = getAccessTokenFromRequest(request);
  const supabase = getSupabaseServerClient(token);
  if (!supabase || !token) return { supabase, user: null };

  const { data } = await supabase.auth.getUser(token);
  return { supabase, user: data?.user || null };
}

