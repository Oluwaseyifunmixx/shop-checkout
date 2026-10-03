import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type RequestAuth = {
  supabase: SupabaseClient;
  user: User | null;
};

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");

  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice("bearer ".length).trim() || null;
}

// Works out who is calling an API route. A mobile app sends its login token in
// the Authorization header; the website sends a cookie. Either way the returned
// client acts as that user, so Row Level Security still protects their data.
export async function getRequestAuth(request: Request): Promise<RequestAuth> {
  const token = getBearerToken(request);

  if (token) {
    const { url, publishableKey } = getSupabaseEnv();
    const supabase = createSupabaseClient(url, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Asks Supabase's auth server to check the token, rather than trusting it.
    const { data } = await supabase.auth.getUser(token);
    return { supabase, user: data.user };
  }

  const supabase = await createCookieClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}