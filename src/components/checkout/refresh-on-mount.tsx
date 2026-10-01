"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The site header lives in the root layout, which Next.js keeps on screen
// during in-app navigation instead of reloading it. After a payment is
// confirmed, refresh once so the header re-reads the (now empty) cart.
export function RefreshOnMount() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [router]);

  return null;
}