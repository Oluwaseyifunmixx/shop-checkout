# Crafted

**Handmade goods from independent Nigerian makers.**

A full-stack shop with Google sign-in, a database-backed cart, a checkout page with Paystack payments, and order confirmation emails sent with Mailgun.

**Live demo:** https://shop-checkout-six.vercel.app/

## Try it

1. Browse the products. No account is needed to look around.
2. Click **Sign in with Google**, then add a few products to your cart.
3. Open the cart (the bag icon) and click **Checkout**.
4. Enter delivery details and click **Pay**. You'll be taken to Paystack's secure test payment page.
5. Pay with Paystack's test card: **4084 0840 8408 4081**, any future expiry date, CVV **408**. If asked, the PIN is **0000** and the OTP is **123456**.
6. You'll land on the order confirmation page, your cart is emptied, and a confirmation email is sent.

> **Note on emails:** Mailgun's free sandbox only delivers to email addresses that have been added as authorised recipients. Confirmation emails are fully implemented, but will only arrive for authorised addresses. Sending to anyone requires a verified custom domain.

> **Note on payments:** Paystack runs in **test mode**. No real money is taken.

## Features

- **Google sign-in** with Supabase Auth, configured through Google Cloud Console
- **Product catalogue** stored in Supabase (PostgreSQL)
- **Persistent cart**: saved to the database per user, with quantity controls and a slide-out cart panel
- **Checkout page** with validated delivery details and an order summary
- **Paystack payments**, verified on the server before an order is marked paid
- **Order confirmation emails** through Mailgun, sent exactly once per order
- **Everything persisted**: products, carts, orders and order items all live in Supabase
- **Responsive** on phone, tablet and desktop

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | Supabase Auth with Google OAuth (Google Cloud Console) |
| Payments | Paystack (redirect checkout + server-side verification) |
| Email | Mailgun HTTP API |
| Validation | Zod, shared by forms and server actions |
| Forms | react-hook-form |
| UI | Tailwind CSS v4, shadcn/ui, lucide-react, sonner |
| Hosting | Vercel |

## How checkout works

1. The shopper submits delivery details. A **server action** loads their cart, calculates the total from **database prices** (never from the browser), and creates a `pending` order with a unique payment reference.
2. The server asks Paystack to start a payment for that exact amount, and the shopper is redirected to Paystack.
3. After paying, Paystack sends the shopper to `/checkout/verify`. The server asks Paystack directly whether the payment succeeded, **and checks the amount and currency match the order**.
4. Only then is the order marked `paid`, the cart emptied, and the confirmation email sent. A conditional update means this happens **exactly once**, even if the page is refreshed.

## Security

- **Row Level Security** on every table. Shoppers can browse products, manage only their own cart, and view only their own orders. They can never create or modify orders.
- **Orders are written only by the server**, using the Supabase secret key, so nobody can mark their own order as paid.
- **Secret keys never reach the browser**: files that use them import `server-only`, which fails the build if they're ever bundled for the client.
- **Prices are stored in kobo** (whole numbers) to avoid rounding errors, and order items keep a copy of the price paid.
- **Customer input is escaped** before it goes into email HTML.
- **Sign-in redirects only go to pages on this site**, preventing open-redirect attacks.

## Running it locally

### Prerequisites

- Node.js 20 or newer
- Accounts on Supabase, Google Cloud, Paystack and Mailgun (all free)

### 1. Install

```bash
git clone https://github.com/Oluwaseyifunmixx/shop-checkout.git
cd shop-checkout
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project, then run `supabase/schema.sql` in the **SQL Editor**. It creates the tables, security policies and sample products.
2. Copy the project URL, publishable key and secret key into `.env.local`.
3. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/**` to the Redirect URLs.

### 3. Google sign-in

1. In Google Cloud Console, create an OAuth client (**Web application**).
2. Add `http://localhost:3000` as an authorised JavaScript origin, and Supabase's callback URL (from **Authentication → Providers → Google**) as an authorised redirect URI.
3. Paste the client ID and secret into Supabase's Google provider, and enable it.

### 4. Paystack

Copy your **test** secret key from **Settings → API Keys & Webhooks** into `.env.local`.

### 5. Mailgun

Copy your API key and sandbox domain into `.env.local`, and add your email as an **authorised recipient** on the sandbox domain.

### 6. Run

```bash
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (safe for the browser; protected by RLS) |
| `SUPABASE_SECRET_KEY` | Supabase secret key (server only; writes orders) |
| `PAYSTACK_SECRET_KEY` | Paystack test secret key (server only) |
| `MAILGUN_API_KEY` | Mailgun API key (server only) |
| `MAILGUN_DOMAIN` | Mailgun sending domain, e.g. your sandbox domain |
| `MAILGUN_API_BASE_URL` | `https://api.mailgun.net` (US) or `https://api.eu.mailgun.net` (EU) |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run lint` | Lint the project |
| `npx tsc --noEmit` | Type-check the project |

## Project structure

See [`AGENTS.md`](./AGENTS.md) for the full structure, architecture rules and conventions.

## Author

Built by **Seyi Akinlabi** ([@Oluwaseyifunmixx](https://github.com/Oluwaseyifunmixx)).