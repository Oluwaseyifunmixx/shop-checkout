# AGENTS.md

Guidance for AI coding agents working in this repository. Read this before making changes.

## Project overview

Crafted is a full-stack shop built with Next.js 16 (App Router). Shoppers browse products, sign in with Google, manage a database-backed cart, check out with Paystack, and receive a Mailgun confirmation email. All data lives in Supabase. A companion mobile app (Crafted-Mobile, built with Expo) uses the same data through the JSON routes in `src/app/api/`.

## Commands

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Start the dev server | `npm run dev` |
| Type-check | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Production build | `npm run build` |

Run the type-check and lint before every commit. Both must pass with zero errors and zero warnings.

## Environment

Copy `.env.example` to `.env.local`. Only variables starting with `NEXT_PUBLIC_` may be used in browser code; everything else is server-only. Never commit `.env.local` or any real secret.

## Project structure

```
src/
├── app/
│   ├── page.tsx                 Product listing (home)
│   ├── actions/                 Server actions: cart.ts, checkout.ts
│   ├── api/                     JSON endpoints for the mobile app: products, cart, orders
│   ├── auth/callback/route.ts   Exchanges Google's sign-in code for a session
│   ├── orders/page.tsx          The shopper's order history
│   ├── checkout/
│   │   ├── page.tsx             Checkout form and order summary
│   │   ├── verify/route.ts      Paystack callback: confirms payment, then redirects
│   │   └── confirmation/        Paid, failed and pending order states
│   ├── privacy/page.tsx         Privacy policy (required for Google OAuth publishing)
│   └── layout.tsx               Root layout, header, toasts
├── components/
│   ├── ui/                      shadcn components (generated)
│   ├── auth/                    Sign-in button, user menu
│   ├── cart/                    Cart sheet and cart line
│   ├── checkout/                Checkout form, order summary
│   ├── layout/                  Site header
│   └── products/                Product card, image, add-to-cart button
├── lib/
│   ├── supabase/                client.ts (browser), server.ts (server, cookies), admin.ts (secret key), request-auth.ts (who is calling an API route)
│   ├── data/                    Server-side reads: products, cart, orders
│   ├── emails/                  Email templates
│   ├── validations/             Zod schemas
│   ├── cart.ts                  Cart totals and limits (shared by client and server)
│   ├── cart-service.ts          Cart add, update and remove logic, shared by server actions and API routes
│   ├── api/                     Shared response helpers for API routes
│   ├── orders.ts                Payment confirmation and order emails
│   ├── paystack.ts              Paystack API calls
│   ├── mailgun.ts               Mailgun API calls
│   └── format.ts                Currency formatting
├── types/                       Shared TypeScript types
└── proxy.ts                     Refreshes the Supabase session on every request
supabase/schema.sql              Tables, RLS policies and seed data
public/products/                 Product photos
```

## Architecture rules

1. **Money is stored in kobo** (integers). Format only for display with `formatNaira`.
2. **Totals always come from database prices**, never from the browser.
3. **A payment is only trusted after server-side verification** with Paystack, including matching amount and currency.
4. **`confirmOrderPayment` must stay idempotent.** It updates orders with `.eq("status", "pending")` so follow-up work (clearing the cart, sending the email) happens exactly once.
5. **Orders are written only with the admin client** (`lib/supabase/admin.ts`). Shoppers' RLS policies allow reading their own orders, never writing them.
6. **Any file using a secret key imports `server-only`.**
7. **When using the admin client to read data for a user, check ownership manually**, since it bypasses RLS.
8. **Server actions return result objects** (`{ ok: true }` or `{ ok: false, code, message }`) instead of throwing, so the UI can react to expected cases like "sign in required".
9. **Side effects that change what the header shows** (like emptying the cart) must finish before a page renders, because layouts and pages render in parallel. That's why Paystack returns to `/checkout/verify` first.
10. **A failed email must never undo a successful payment.** Log email errors; don't throw them.
11. **API routes identify the caller with `getRequestAuth`** and use the client it returns, never the admin client. That client acts as the user, so Row Level Security protects their data.
12. **Cart rules live in `lib/cart-service.ts`.** Server actions and API routes both call it, so validation and the quantity limit exist once.
13. **Routes that change data are token only**: `getRequestAuth(request, { allowCookie: false })`. Browsers send cookies automatically, so a cookie-authenticated write could be triggered from another site. Read routes may accept the cookie.
14. **API routes answer in JSON with the right status** (401 signed out, 400 invalid input, 500 server error) and `{ error: string }` on failure. Send money in kobo, images as full URLs, and never return payment references or other internal fields.

## Code conventions

- File names: kebab-case. Components: PascalCase. Hooks start with `use`.
- Route files must be named exactly `route.ts`; pages exactly `page.tsx`.
- A `"use server"` file may only export async functions. Shared constants go in `lib/`.
- Prefer small, single-purpose components and early returns over nested ternaries.
- No magic numbers: name them as constants.
- Comments explain *why*, not *what*.
- Import with the `@/` alias.

## Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `style:`, `chore:`, `docs:`.
- Stage files explicitly by path; do not use `git add .`.

## Workflow for making changes

1. **Understand the request** and identify the layers it touches: schema, validation, data access, server action or route, UI.
2. **Work from the data outwards:** update `supabase/schema.sql` (and run it), then types, then server code, then UI.
3. **Check every state:** signed in and signed out, loading, empty, error and success, at phone, tablet and laptop widths.
4. **Verify:** `npx tsc --noEmit` and `npm run lint` must be clean.
5. **Commit in small, focused steps** with conventional commit messages.