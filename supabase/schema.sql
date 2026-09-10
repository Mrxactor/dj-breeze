-- DJ Breeze Bookings backend (Supabase/Postgres)
-- Run this once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_type text not null check (event_type in ('club','wedding','private','corporate','public')),
  event_date date,
  venue text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  message text,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  source text not null default 'website'
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.admin_users enable row level security;

-- Anyone visiting the public website may CREATE a booking request,
-- but they cannot read or modify bookings.
drop policy if exists "public can create bookings" on public.bookings;
create policy "public can create bookings"
on public.bookings
for insert
to anon
with check (status = 'pending');

-- Only users explicitly added to admin_users can see and manage bookings.
drop policy if exists "admins can read bookings" on public.bookings;
create policy "admins can read bookings"
on public.bookings
for select
to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "admins can update bookings" on public.bookings;
create policy "admins can update bookings"
on public.bookings
for update
to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create or replace function public.set_booking_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_booking_updated_at();

-- FINAL ADMIN SETUP:
-- 1) Create Erik's user in Supabase Authentication.
-- 2) Copy that user's UUID.
-- 3) Run: insert into public.admin_users(user_id) values ('PASTE-USER-UUID-HERE');
