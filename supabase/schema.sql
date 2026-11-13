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
create index if not exists idx_trip_items_trip_id on public.trip_items(trip_id);
create index if not exists idx_user_events_trip_id on public.user_events(trip_id) where trip_id is not null;

-- ==========================================================
-- Functions & triggers
-- ==========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
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

-- handle_new_auth_user must never be publicly callable - it only ever runs
-- as the trigger owner inside the auth.users insert path.
revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.handle_new_auth_user() from authenticated;

-- ==========================================================
-- v1.27 (2026-11-13): mirrored from supabase/migrations/20261113_*.sql
-- ==========================================================
-- ==========================================================
-- Profile preferences + consents (Phase 2, approved 2026-11-13)
-- Additive only: new nullable columns on public.profiles.
-- Existing RLS policy "profiles_own" (own row only) covers them.
-- ==========================================================
alter table public.profiles
  add column if not exists home_region text null,
  add column if not exists home_airport text null,
  add column if not exists handicap_band text null,
  add column if not exists home_club text null,
  add column if not exists play_frequency text null,
  add column if not exists course_preferences text[] not null default '{}',
  add column if not exists travel_party text null,
  add column if not exists trip_length text null,
  add column if not exists preferred_months smallint[] not null default '{}',
  add column if not exists budget_level text null,
  add column if not exists travel_modes text[] not null default '{}',
  add column if not exists wishlist_regions text[] not null default '{}',
  add column if not exists trip_extras text[] not null default '{}',
  add column if not exists interests text[] not null default '{}',
  add column if not exists consent_partner_offers boolean not null default false,
  add column if not exists consent_partner_offers_at timestamptz null,
  add column if not exists consent_market_research boolean not null default false,
  add column if not exists consent_market_research_at timestamptz null,
  add column if not exists onboarding_completed_at timestamptz null,
  add column if not exists onboarding_dismissed_at timestamptz null;

alter table public.profiles drop constraint if exists profiles_handicap_band_check;
alter table public.profiles add constraint profiles_handicap_band_check
  check (handicap_band is null or handicap_band in ('under_10','10_20','20_36','36_plus','none'));

alter table public.profiles drop constraint if exists profiles_play_frequency_check;
alter table public.profiles add constraint profiles_play_frequency_check
  check (play_frequency is null or play_frequency in ('rarely','few_per_year','weekly','almost_daily'));

alter table public.profiles drop constraint if exists profiles_travel_party_check;
alter table public.profiles add constraint profiles_travel_party_check
  check (travel_party is null or travel_party in ('solo','couple_both_golf','couple_one_golfs','friends','family'));

alter table public.profiles drop constraint if exists profiles_trip_length_check;
alter table public.profiles add constraint profiles_trip_length_check
  check (trip_length is null or trip_length in ('weekend','4_5_days','week','longer'));

alter table public.profiles drop constraint if exists profiles_budget_level_check;
alter table public.profiles add constraint profiles_budget_level_check
  check (budget_level is null or budget_level in ('relaxed','upscale','luxury'));

alter table public.profiles drop constraint if exists profiles_preferred_months_check;
alter table public.profiles add constraint profiles_preferred_months_check
  check (preferred_months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]);

alter table public.profiles drop constraint if exists profiles_text_lengths_check;
alter table public.profiles add constraint profiles_text_lengths_check
  check (
    coalesce(length(home_region), 0) <= 80
    and coalesce(length(home_airport), 0) <= 80
    and coalesce(length(home_club), 0) <= 120
    and coalesce(length(display_name), 0) <= 80
  );

-- ==========================================================
-- analytics_events (Phase 3, approved 2026-11-13)
-- Consent-aware product analytics, incl. guests. Separate from
-- public.user_events, which stays the account history that feeds the
-- consent-gated Brevo lifecycle layer.
--
-- consent = 'anonymous': no anon_id, no user_id (no consent given).
-- consent = 'full': anon_id from the browser, user_id once linked.
--
-- Written only server-side (/api/events with the secret key). RLS is on
-- and there are deliberately NO policies: the browser can neither read
-- nor write this table.
-- ==========================================================
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  event_name text not null,
  consent text not null,
  anon_id uuid null,
  user_id uuid null references auth.users(id) on delete cascade,
  path text null,
  source_id text null,
  source_type text null,
  source_role text null,
  slug text null,
  query text null,
  value numeric null,
  trip_id uuid null,
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  referrer_host text null
);

alter table public.analytics_events drop constraint if exists analytics_events_event_name_check;
alter table public.analytics_events add constraint analytics_events_event_name_check
  check (event_name in (
    'page_viewed','content_viewed','story_read','search_performed',
    'content_saved','content_unsaved','save_limit_hint','save_limit_reached',
    'login_prompt_shown','login_prompt_dismissed','account_created',
    'trip_created','content_added_to_trip','trip_dates_set','booking_clicked',
    'onboarding_completed','onboarding_skipped','profile_updated'
  ));

alter table public.analytics_events drop constraint if exists analytics_events_consent_check;
alter table public.analytics_events add constraint analytics_events_consent_check
  check (
    (consent = 'anonymous' and anon_id is null and user_id is null)
    or consent = 'full'
  );

alter table public.analytics_events drop constraint if exists analytics_events_source_type_check;
alter table public.analytics_events add constraint analytics_events_source_type_check
  check (source_type is null or source_type in ('destination','place','story','person','object','collection'));

create index if not exists idx_analytics_events_occurred_at on public.analytics_events(occurred_at desc);
create index if not exists idx_analytics_events_name_time on public.analytics_events(event_name, occurred_at desc);
create index if not exists idx_analytics_events_anon_id on public.analytics_events(anon_id) where anon_id is not null;
create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id) where user_id is not null;

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;

-- v1.27b (2026-11-13): mirrored from supabase/migrations/20261113_profile_preferences_v2.sql
-- ==========================================================
-- Profile preferences v2 (approved 2026-11-13, "Profilfragen zum Abhaken")
-- Separates purpose (wofür), companions (mit wem), extras (neben Golf);
-- adds organizer role, group size, rounds, frequency, accommodation,
-- budget per night, booking channel, age band.
-- Replaces travel_party (single choice) and budget_level, both introduced
-- earlier the same day and never released; existing test values are mapped.
-- ==========================================================
alter table public.profiles
  add column if not exists trip_purposes text[] not null default '{}',
  add column if not exists organizer_role text null,
  add column if not exists group_size text null,
  add column if not exists travel_companions text[] not null default '{}',
  add column if not exists rounds_per_trip text null,
  add column if not exists trips_per_year text null,
  add column if not exists accommodation_styles text[] not null default '{}',
  add column if not exists budget_per_night text null,
  add column if not exists booking_channel text null,
  add column if not exists age_band text null;

-- Map unreleased v1 values.
update public.profiles set travel_companions = array[
  case travel_party
    when 'solo' then 'solo'
    when 'couple_both_golf' then 'partner_golfs'
    when 'couple_one_golfs' then 'partner_non_golfer'
    when 'friends' then 'friends'
    when 'family' then 'kids'
  end]
where travel_party is not null and cardinality(travel_companions) = 0;

update public.profiles set trip_extras = array(
  select case extra
    when 'food' then 'food_wine'
    when 'nature' then 'hiking'
    when 'sea' then 'beach_water'
    when 'culture' then 'culture_city'
    else extra
  end from unnest(trip_extras) as extra
);

update public.profiles set handicap_band = 'beginner' where handicap_band = 'none';

alter table public.profiles drop constraint if exists profiles_travel_party_check;
alter table public.profiles drop constraint if exists profiles_budget_level_check;
alter table public.profiles drop column if exists travel_party;
alter table public.profiles drop column if exists budget_level;

alter table public.profiles drop constraint if exists profiles_handicap_band_check;
alter table public.profiles add constraint profiles_handicap_band_check
  check (handicap_band is null or handicap_band in ('beginner','36_plus','20_36','10_20','under_10'));

alter table public.profiles drop constraint if exists profiles_organizer_role_check;
alter table public.profiles add constraint profiles_organizer_role_check
  check (organizer_role is null or organizer_role in ('none','friends','captain_men','captain_women','captain_seniors','captain_youth_mixed','club','professional'));

alter table public.profiles drop constraint if exists profiles_group_size_check;
alter table public.profiles add constraint profiles_group_size_check
  check (group_size is null or group_size in ('2_4','5_8','9_16','17_plus'));

alter table public.profiles drop constraint if exists profiles_rounds_per_trip_check;
alter table public.profiles add constraint profiles_rounds_per_trip_check
  check (rounds_per_trip is null or rounds_per_trip in ('1_2','3_4','5_plus','daily'));

alter table public.profiles drop constraint if exists profiles_trips_per_year_check;
alter table public.profiles add constraint profiles_trips_per_year_check
  check (trips_per_year is null or trips_per_year in ('1','2_3','4_plus'));

alter table public.profiles drop constraint if exists profiles_budget_per_night_check;
alter table public.profiles add constraint profiles_budget_per_night_check
  check (budget_per_night is null or budget_per_night in ('under_150','150_300','300_500','over_500'));

alter table public.profiles drop constraint if exists profiles_booking_channel_check;
alter table public.profiles add constraint profiles_booking_channel_check
  check (booking_channel is null or booking_channel in ('direct','portals','tour_operator','club_team'));

alter table public.profiles drop constraint if exists profiles_age_band_check;
alter table public.profiles add constraint profiles_age_band_check
  check (age_band is null or age_band in ('under_30','30_44','45_59','60_69','70_plus'));
