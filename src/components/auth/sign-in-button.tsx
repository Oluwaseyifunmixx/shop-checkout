"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignInButton() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleSignIn() {
    setIsRedirecting(true);

    const supabase = createClient();
    const returnPath = window.location.pathname;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnPath)}`,
      },
    });

    if (error) {
      setIsRedirecting(false);
      toast.error("Couldn't start Google sign-in. Please try again.");
    }
  }

  return (
    <Button onClick={handleSignIn} disabled={isRedirecting}>
      {isRedirecting ? "Redirecting…" : "Sign in with Google"}
    </Button>
  );
}