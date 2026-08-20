-- AROUND Product System v1
-- User/product data only. Editorial content remains in Sanity.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  source_type text not null check (source_type in ('destination','place','story','person','object','collection')),
  title_snapshot text,
  slug_snapshot text,
  created_at timestamptz not null default now(),
  unique(user_id, source_id)
);

create table if not exists public.user_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.user_collections(id) on delete cascade,
  source_id text not null,
  source_type text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(collection_id, source_id)
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination_source_id text,
  start_date date,
  end_date date,
  status text not null default 'idea' check (status in ('idea','planning','booked','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  source_id text not null,
  source_type text not null,
  day_index integer,
  slot text,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.saved_items enable row level security;
alter table public.user_collections enable row level security;
alter table public.user_collection_items enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "saved_items_own" on public.saved_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "collections_own_write" on public.user_collections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "collections_public_read" on public.user_collections
  for select using (is_public = true or auth.uid() = user_id);

create policy "collection_items_owner" on public.user_collection_items
  for all using (
    exists (
      select 1 from public.user_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "trips_own" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trip_items_owner" on public.trip_items
  for all using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  );

create index if not exists idx_saved_items_user on public.saved_items(user_id, created_at desc);
create index if not exists idx_saved_items_source on public.saved_items(source_id);
create index if not exists idx_user_collections_user on public.user_collections(user_id, updated_at desc);
create index if not exists idx_trips_user on public.trips(user_id, updated_at desc);
