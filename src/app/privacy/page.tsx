import type { Metadata } from "next";

const SHOP_NAME = "Shop";
const CONTACT_EMAIL = "your-email@example.com";
const LAST_UPDATED = "30 September 2026";

export const metadata: Metadata = {
  title: `Privacy Policy · ${SHOP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What we collect</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Your Google account details:</strong>{" "}
            your name and email address, when you sign in with Google.
          </li>
          <li>
            <strong className="text-foreground">Order details:</strong> your
            delivery address, phone number, and the items you buy.
          </li>
          <li>
            <strong className="text-foreground">Your cart:</strong> the items
            you add, so they are still there when you come back.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What we don&rsquo;t collect</h2>
        <p className="text-muted-foreground">
          We never see or store your card details. Payments are processed
          securely by Paystack.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How we use it</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>To process and deliver your orders.</li>
          <li>To send your order confirmation email.</li>
          <li>To keep your cart saved between visits.</li>
        </ul>
        <p className="text-muted-foreground">
          We do not sell your information or use it for advertising.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Who we share it with</h2>
        <p className="text-muted-foreground">
          Only the services that run the shop: Supabase (database and
          sign-in), Paystack (payments) and Mailgun (email delivery).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your choices</h2>
        <p className="text-muted-foreground">
          To have your account and data deleted, email us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </article>
  );
}