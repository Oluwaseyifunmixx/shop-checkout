-- =========================================================
-- Tables
-- =========================================================

-- Products the shop sells. Prices are whole kobo (₦1 = 100 kobo).
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price_kobo integer not null check (price_kobo > 0),
  image_url text,
  created_at timestamptz not null default now()
);

-- Each signed-in shopper's cart. One row per product per user.
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 20),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- One row per checkout. Only the server (secret key) writes here.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed')),
  total_kobo integer not null check (total_kobo > 0),
  email text not null,
  full_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  payment_reference text not null unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- The products in each order, with name and price copied at purchase time.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price_kobo integer not null check (unit_price_kobo > 0),
  quantity integer not null check (quantity > 0)
);

create index on public.cart_items (user_id);
create index on public.orders (user_id, created_at desc);
create index on public.order_items (order_id);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Products: anyone can browse.
create policy "Anyone can view products"
  on public.products for select
  to anon, authenticated
  using (true);

-- Cart: shoppers manage only their own items.
create policy "Users can view their own cart"
  on public.cart_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add to their own cart"
  on public.cart_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own cart"
  on public.cart_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can remove from their own cart"
  on public.cart_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Orders: shoppers can view their own, but never create or change them.
create policy "Users can view their own orders"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view items in their own orders"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = (select auth.uid())
    )
  );

-- =========================================================
-- Sample products (prices in kobo)
-- =========================================================

insert into public.products (name, description, price_kobo) values
  ('Adire Tote Bag', 'Hand-dyed indigo cotton tote, roomy enough for a laptop and more.', 1500000),
  ('Raw Shea Butter (250g)', 'Unrefined shea butter for skin and hair, sourced from northern Nigeria.', 450000),
  ('Ankara Notebook', 'A5 hardcover notebook wrapped in Ankara fabric, 160 lined pages.', 350000),
  ('Scented Soy Candle', 'Hand-poured candle with notes of vanilla and hibiscus. Burns for 40 hours.', 800000),
  ('Leather Slides', 'Handmade leather slides with a cushioned sole. Unisex.', 2200000),
  ('Stoneware Mug', 'Speckled stoneware mug, 350ml. Dishwasher safe.', 650000),
  ('Wooden Serving Bowl', 'Hand-carved hardwood bowl for salads, fruit or display.', 1200000),
  ('Beaded Bracelet Set', 'Set of three handmade glass-bead bracelets.', 500000);