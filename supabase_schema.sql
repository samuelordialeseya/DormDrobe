-- ─── DormDrobe Database Schema for Supabase ──────────────────────────
-- Run this in your Supabase project SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the clothing_items table
create table if not exists public.clothing_items (
  id text primary key,
  name text not null,
  category text not null check (category in ('tops', 'bottoms', 'underwear', 'footwear', 'outerwear', 'accessories')),
  color text not null,
  brand text,
  location text not null check (location in ('calamba_home', 'batangas_dorm', 'in_transit_bag')),
  status text not null check (status in ('clean', 'worn', 'in_laundry', 'drying', 'misplaced')),
  image_url text,
  is_uniform_white_tee boolean default false,
  last_worn_at timestamptz,
  notes text default '',
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.clothing_items enable row level security;

-- 3. Create access policy for anonymous client access
create policy "Allow all operations for anon" on public.clothing_items
  for all using (true) with check (true);

-- 4. Enable Realtime (optional, for instant multi-device live sync)
alter publication supabase_realtime add table public.clothing_items;
