-- AROUND v1.26a: MY AROUND user intelligence foundation.
-- Idempotent - safe to run once against the live project. Does not touch
-- editorial content, Trip Fit, or existing saved_items/trips/collections data.

-- ==========================================================
-- 1. Generic updated_at trigger (reused by the tables below)
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

-- ==========================================================
-- 2. profiles - safe extension only
-- ==========================================================
alter table public.profiles add column if not exists locale text not null default 'de';
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ==========================================================
-- 3. communication_preferences
-- Account creation != marketing consent: every flag defaults to false.
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

alter table public.communication_preferences enable row level security;

drop trigger if exists set_communication_preferences_updated_at on public.communication_preferences;
create trigger set_communication_preferences_updated_at
  before update on public.communication_preferences
  for each row execute function public.set_updated_at();

drop policy if exists "communication_preferences_select_own" on public.communication_preferences;
create policy "communication_preferences_select_own" on public.communication_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "communication_preferences_insert_own" on public.communication_preferences;
create policy "communication_preferences_insert_own" on public.communication_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "communication_preferences_update_own" on public.communication_preferences;
create policy "communication_preferences_update_own" on public.communication_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================================
-- 4. user_access
-- Authoritative account/plan metadata. A user may READ their own row only -
-- there is no INSERT/UPDATE/DELETE policy, so a signed-in browser session
-- can never grant itself premium. Only a service-role key (future
-- payment/service-role logic) or the SECURITY DEFINER bootstrap below can
-- write this table.
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

alter table public.user_access enable row level security;

drop trigger if exists set_user_access_updated_at on public.user_access;
create trigger set_user_access_updated_at
  before update on public.user_access
  for each row execute function public.set_updated_at();

drop policy if exists "user_access_select_own" on public.user_access;
create policy "user_access_select_own" on public.user_access
  for select using (auth.uid() = user_id);

-- ==========================================================
-- 5. user_entitlements
-- Capability grants. Read-only from the browser under any role - no
-- INSERT/UPDATE/DELETE policy exists, so premium capabilities can never be
-- self-granted client-side.
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

alter table public.user_entitlements enable row level security;

drop policy if exists "user_entitlements_select_own" on public.user_entitlements;
create policy "user_entitlements_select_own" on public.user_entitlements
  for select using (auth.uid() = user_id);

-- ==========================================================
-- 6. user_events
-- Append-only product history. Users may insert/select their own events;
-- no update/delete policy exists, so events cannot be edited or removed
-- after the fact.
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

alter table public.user_events enable row level security;

create index if not exists idx_user_events_user_occurred on public.user_events(user_id, occurred_at desc);
create index if not exists idx_user_events_name_occurred on public.user_events(event_name, occurred_at desc);
create index if not exists idx_user_events_source_id on public.user_events(source_id) where source_id is not null;

drop policy if exists "user_events_select_own" on public.user_events;
create policy "user_events_select_own" on public.user_events
  for select using (auth.uid() = user_id);

-- v1.26a.1: a browser user may only attach an event to a Trip they own -
-- trip_id must be null, or reference a public.trips row whose user_id
-- matches the inserting user. Prevents cross-account Trip references in
-- event history.
drop policy if exists "user_events_insert_own" on public.user_events;
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
-- 7. Account bootstrap
-- New auth users automatically receive a profile, communication
-- preferences (all false) and a free/none access row. SECURITY DEFINER is
-- required here: the trigger runs inside auth's own insert into auth.users,
-- where auth.uid() does not resolve to the new user, so a normal
-- RLS-scoped insert would be rejected by the policies above. This function
-- is the one deliberate, narrowly-scoped exception to "no client can write
-- user_access/user_entitlements" - it never runs client-side and only ever
-- writes the free/none defaults.
-- ==========================================================
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ==========================================================
-- 8. Backfill for existing auth users
-- Never overwrites existing profile/preference/access data - ON CONFLICT DO
-- NOTHING only fills in rows that do not exist yet. Deliberately does NOT
-- backfill a synthetic account_created event for pre-existing users: that
-- event means "this account was just created", which is not true for them.
-- ==========================================================
insert into public.profiles (id, locale, created_at, updated_at)
select u.id, 'de', now(), now()
from auth.users u
on conflict (id) do nothing;

insert into public.communication_preferences (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;

insert into public.user_access (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;
