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

type AuthOptions = {
  // Accept the website's login cookie when a request has no token. Routes that
  // change data for the mobile app turn this off, so a request that a browser
  // sends on its own (cookies go along automatically) cannot change anything.
  allowCookie?: boolean;
};

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");

  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice("bearer ".length).trim() || null;
}

// A plain Supabase client, with the caller's token attached when there is one.
function createTokenClient(token?: string): SupabaseClient {
  const { url, publishableKey } = getSupabaseEnv();

  return createSupabaseClient(url, publishableKey, {
    ...(token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : {}),
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Works out who is calling an API route. A mobile app sends its login token in
// the Authorization header; the website sends a cookie. Either way the returned
// client acts as that user, so Row Level Security still protects their data.
export async function getRequestAuth(
  request: Request,
  { allowCookie = true }: AuthOptions = {}
): Promise<RequestAuth> {
  const token = getBearerToken(request);

  if (token) {
    const supabase = createTokenClient(token);

    // Asks Supabase's auth server to check the token, rather than trusting it.
    const { data } = await supabase.auth.getUser(token);
    return { supabase, user: data.user };
  }

  if (!allowCookie) {
    return { supabase: createTokenClient(), user: null };
  }

  const supabase = await createCookieClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}