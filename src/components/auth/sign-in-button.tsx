"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startGoogleSignIn } from "@/lib/auth/sign-in";

export function SignInButton() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleSignIn() {
    setIsRedirecting(true);
    const { error } = await startGoogleSignIn(window.location.pathname);

    if (error) {
      setIsRedirecting(false);
      toast.error("Couldn't start Google sign-in. Please try again.");
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleSignIn}
      disabled={isRedirecting}
      className="h-11 px-5 text-base"
    >
      {isRedirecting ? (
        "Redirecting…"
      ) : (
        <>
          <span className="sm:hidden">Sign in</span>
          <span className="hidden sm:inline">Sign in with Google</span>
        </>
      )}
    </Button>
  );
}