let cachedClient = null;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getSupabaseClient() {
  if (cachedClient) return cachedClient;
  if (!isSupabaseConfigured()) return null;

  const { createClient } = await import("@supabase/supabase-js");

  const dbSchema = process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA || process.env.SUPABASE_DB_SCHEMA || 'public';
  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { db: { schema: dbSchema } }
  );

  return cachedClient;
}


