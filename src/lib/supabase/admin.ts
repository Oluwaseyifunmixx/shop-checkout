import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

// Uses the secret key, which bypasses Row Level Security. Only trusted server
// code may use this, for writes shoppers can't do themselves, like orders.
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY. Add it to .env.local.");
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}