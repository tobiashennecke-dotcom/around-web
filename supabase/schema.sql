-- AROUND Product System
-- User/product data only. Editorial content remains in Sanity.
--
-- This file is the fresh-bootstrap schema: it represents the cumulative
-- result of schema.sql + every file in supabase/migrations/, as of v1.26a.
-- It is not itself re-run against the live project - the live project is
-- kept up to date by applying supabase/migrations/*.sql in order. When
-- adding a new migration, also update this file so a brand-new environment
-- ends up in the same shape as the live one.

create extension if not exists "pgcrypto";

-- ==========================================================
-- profiles
-- ==========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'de',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================================
-- saved_items
-- SAVE means "this interests me" - independent of Trip and Collection.
-- ==========================================================
create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  source_type text not null check (source_type in ('destination','place','story','person','object','collection')),
  source_role text,
  title_snapshot text,
  slug_snapshot text,
  created_at timestamptz not null default now(),
  unique(user_id, source_id)
);

alter table public.saved_items drop constraint if exists saved_items_source_role_check;
alter table public.saved_items add constraint saved_items_source_role_check
  check (source_role is null or source_role in ('play','stay','eat','do'));

-- ==========================================================
-- user_collections / user_collection_items
-- COLLECTION means "I want to organize this."
-- ==========================================================
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
  source_role text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(collection_id, source_id)
);

alter table public.user_collection_items drop constraint if exists user_collection_items_source_role_check;
alter table public.user_collection_items add constraint user_collection_items_source_role_check
  check (source_role is null or source_role in ('play','stay','eat','do'));

-- ==========================================================
-- trips / trip_items
-- TRIP means "I am actually planning this journey."
-- ==========================================================
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination_source_id text,
  start_date date,
  end_date date,
  status text not null default 'idea' check (status in ('idea','planning','booked','completed')),
  plan_ready boolean not null default false,
  stay_exempt_nights integer[] not null default '{}'::integer[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  source_id text not null,
  source_type text not null,
  source_role text,
  day_index integer,
  slot text,
  note text,
  -- STAY items are multi-night accommodation segments, not normal day stops.
  stay_start_day integer,
  stay_end_day integer,
  stay_full_trip boolean not null default false,
  -- Exact-time appointments (tee times, reservations) vs flexible stops.
  is_fixed boolean not null default false,
  fixed_time time without time zone,
  duration_minutes integer,
  booking_state text not null default 'none',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.trip_items drop constraint if exists trip_items_source_role_check;
alter table public.trip_items add constraint trip_items_source_role_check
  check (source_role is null or source_role in ('play','stay','eat','do'));

alter table public.trip_items drop constraint if exists trip_items_stay_start_day_nonnegative;
alter table public.trip_items add constraint trip_items_stay_start_day_nonnegative
  check (stay_start_day is null or stay_start_day >= 0);

alter table public.trip_items drop constraint if exists trip_items_stay_end_day_nonnegative;
alter table public.trip_items add constraint trip_items_stay_end_day_nonnegative
  check (stay_end_day is null or stay_end_day >= 0);

alter table public.trip_items drop constraint if exists trip_items_stay_range_valid;
alter table public.trip_items add constraint trip_items_stay_range_valid
  check (stay_start_day is null or stay_end_day is null or stay_end_day > stay_start_day);

alter table public.trip_items drop constraint if exists trip_items_duration_minutes_check;
alter table public.trip_items add constraint trip_items_duration_minutes_check
  check (duration_minutes is null or (duration_minutes >= 15 and duration_minutes <= 1440));

alter table public.trip_items drop constraint if exists trip_items_booking_state_check;
alter table public.trip_items add constraint trip_items_booking_state_check
  check (booking_state in ('none','requested','confirmed'));

-- ==========================================================
-- communication_preferences (v1.26a)
-- Account creation != marketing consent: every flag defaults to false.
-- around_drops (commercial) stays separate from editorial preferences.
-- ==========================================================
create table if not exists public.communication_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  around_journal boolean not null default false,
  my_around_updates boolean not null default false,
  trip_intelligence boolean not null default false,
  around_drops boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================================
-- user_access (v1.26a)
-- Authoritative plan/subscription metadata. Never writable from the
-- browser - see RLS policies below.
-- ==========================================================
create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  subscription_status text not null default 'none',
  source text not null default 'system',
  current_period_end timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_access drop constraint if exists user_access_plan_check;
alter table public.user_access add constraint user_access_plan_check
  check (plan in ('free','premium'));

alter table public.user_access drop constraint if exists user_access_subscription_status_check;
alter table public.user_access add constraint user_access_subscription_status_check
  check (subscription_status in ('none','trialing','active','past_due','cancelled'));

-- ==========================================================
-- user_entitlements (v1.26a)
-- Capability grants. Read-only from the browser - see RLS policies below.
-- Active when: (starts_at is null or starts_at <= now())
--          and (ends_at is null or ends_at > now())
-- ==========================================================
create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null,
  source text not null default 'system',
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_at timestamptz not null default now(),
  unique(user_id, entitlement_key)
);

alter table public.user_entitlements drop constraint if exists user_entitlements_key_check;
alter table public.user_entitlements add constraint user_entitlements_key_check
  check (entitlement_key in (
    'read_premium_stories',
    'advanced_trip_planning',
    'personal_travel_briefing',
    'smart_day_planning'
  ));

-- ==========================================================
-- user_events (v1.26a)
-- Append-only product history - no update/delete policy exists.
-- ==========================================================
create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  source_id text null,
  source_type text null,
  source_role text null,
  trip_id uuid null references public.trips(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table public.user_events drop constraint if exists user_events_event_name_check;
alter table public.user_events add constraint user_events_event_name_check
  check (event_name in (
    'account_created',
    'content_viewed',
    'content_saved',
    'content_unsaved',
    'trip_created',
    'content_added_to_trip',
    'trip_dates_set',
    'booking_clicked'
  ));

alter table public.user_events drop constraint if exists user_events_source_role_check;
alter table public.user_events add constraint user_events_source_role_check
  check (source_role is null or source_role in ('play','stay','eat','do'));

alter table public.user_events drop constraint if exists user_events_source_type_check;
alter table public.user_events add constraint user_events_source_type_check
  check (source_type is null or source_type in (
    'destination','place','story','person','object','collection'
  ));

-- ==========================================================
-- Row level security
-- ==========================================================
alter table public.profiles enable row level security;
alter table public.saved_items enable row level security;
alter table public.user_collections enable row level security;
alter table public.user_collection_items enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;
alter table public.communication_preferences enable row level security;
alter table public.user_access enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.user_events enable row level security;

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

-- communication_preferences: user may select/insert/update their own row only.
create policy "communication_preferences_select_own" on public.communication_preferences
  for select using (auth.uid() = user_id);
create policy "communication_preferences_insert_own" on public.communication_preferences
  for insert with check (auth.uid() = user_id);
create policy "communication_preferences_update_own" on public.communication_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_access: select-only. No insert/update/delete policy exists, so a
-- signed-in browser session can never grant itself premium. Only a
-- service-role key or the SECURITY DEFINER bootstrap function may write it.
create policy "user_access_select_own" on public.user_access
  for select using (auth.uid() = user_id);

-- user_entitlements: select-only, same reasoning as user_access.
create policy "user_entitlements_select_own" on public.user_entitlements
  for select using (auth.uid() = user_id);

-- user_events: append-only. Users may select their own events, and may
-- insert their own events only when the attached Trip (if any) is also
-- theirs - trip_id must be null or reference a public.trips row they own.
-- No update/delete policy exists.
create policy "user_events_select_own" on public.user_events
  for select using (auth.uid() = user_id);
create policy "user_events_insert_own" on public.user_events
  for insert with check (
    auth.uid() = user_id
    and (
      trip_id is null
      or exists (
        select 1 from public.trips t
        where t.id = trip_id and t.user_id = auth.uid()
      )
    )
  );

-- ==========================================================
-- Indexes
-- ==========================================================
create index if not exists idx_saved_items_user on public.saved_items(user_id, created_at desc);
create index if not exists idx_saved_items_source on public.saved_items(source_id);
create index if not exists idx_user_collections_user on public.user_collections(user_id, updated_at desc);
create index if not exists idx_trips_user on public.trips(user_id, updated_at desc);
create index if not exists idx_user_events_user_occurred on public.user_events(user_id, occurred_at desc);
create index if not exists idx_user_events_name_occurred on public.user_events(event_name, occurred_at desc);
create index if not exists idx_user_events_source_id on public.user_events(source_id) where source_id is not null;

-- ==========================================================
-- Functions & triggers
-- ==========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_communication_preferences_updated_at
  before update on public.communication_preferences
  for each row execute function public.set_updated_at();

create trigger set_user_access_updated_at
  before update on public.user_access
  for each row execute function public.set_updated_at();

-- New auth users automatically receive a profile, communication
-- preferences (all false) and a free/none access row. SECURITY DEFINER is
-- required: the trigger runs inside auth's own insert into auth.users,
-- where auth.uid() does not resolve to the new user, so a normal
-- RLS-scoped insert would be rejected by the policies above.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, locale, created_at, updated_at)
  values (new.id, 'de', now(), now())
  on conflict (id) do nothing;

  insert into public.communication_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_access (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_events (user_id, event_name, metadata)
  values (new.id, 'account_created', '{}'::jsonb);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
