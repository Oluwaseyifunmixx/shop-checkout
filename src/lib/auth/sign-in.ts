import { createClient } from "@/lib/supabase/client";

export function startGoogleSignIn(returnPath: string) {
  const supabase = createClient();

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnPath)}`,
    },
  });
}