"use server";

import { headers } from "next/headers";
import { createCheckout } from "@/lib/checkout-service";
import { createClient } from "@/lib/supabase/server";
import type { CheckoutInput } from "@/lib/validations/checkout";

export type CheckoutResult =
  | { ok: true; paymentUrl: string }
  | { ok: false; message: string };

export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in to check out." };
  }

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const result = await createCheckout({
    supabase,
    user,
    input,
    callbackUrl: `${origin}/checkout/verify`,
  });

  return result.ok ? { ok: true, paymentUrl: result.paymentUrl } : result;
}