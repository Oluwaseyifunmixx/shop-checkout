"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// How long to wait before refreshing, so a burst of cart changes (for example,
// a payment emptying the whole cart) causes one refresh instead of many.
const REFRESH_DELAY_MS = 150;

// Refreshes the page's server data whenever the shopper's cart changes in the
// database, for example when they add an item in the mobile app or in another
// tab. The cart count and the cart panel then update without a reload.
// Renders nothing.
export function CartRealtimeSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: RealtimeChannel | undefined;
    let cancelled = false;

    async function start() {
      // The cart table is protected by Row Level Security, so Realtime must
      // know who the shopper is before it subscribes.
      const { data } = await supabase.auth.getSession();

      if (cancelled || !data.session) {
        return;
      }

      supabase.realtime.setAuth(data.session.access_token);

      channel = supabase
        .channel("web-cart-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cart_items" },
          () => {
            clearTimeout(timer);
            timer = setTimeout(() => router.refresh(), REFRESH_DELAY_MS);
          }
        )
        .subscribe();
    }

    start();

    return () => {
      cancelled = true;
      clearTimeout(timer);

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  return null;
}