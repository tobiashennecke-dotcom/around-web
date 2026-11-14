-- ==========================================================
-- Profile fun (2026-11-13, "Fun-Ideen fürs Profil zum Abhaken")
-- 1) Steckbrief answers, memories and bag on public.profiles (additive).
-- 2) public.user_place_marks: AROUND Pass (played) and Bucket List.
-- ==========================================================
alter table public.profiles
  add column if not exists player_type text null,
  add column if not exists nemesis text null,
  add column if not exists tee_time_preference text null,
  add column if not exists weather_tolerance text null,
  add column if not exists course_transport text null,
  add column if not exists game_format text null,
  add column if not exists nineteenth_order text null,
  add column if not exists golf_motto text null,
  add column if not exists memories jsonb not null default '{}'::jsonb,
  add column if not exists bag jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_fun_check;
alter table public.profiles add constraint profiles_fun_check check (
  (player_type is null or player_type in ('early_starter','range_philosopher','short_game_artist','long_hitter','rules_expert','nineteenth_hole_pro'))
  and (nemesis is null or nemesis in ('bunker','water','short_putts','first_tee','wind','flight_partner'))
  and (tee_time_preference is null or tee_time_preference in ('first_tee_time','morning','midday','twilight'))
  and (weather_tolerance is null or weather_tolerance in ('sun_only','clouds_ok','drizzle_ok','always'))
  and (course_transport is null or course_transport in ('carry','trolley','e_trolley','cart'))
  and (game_format is null or game_format in ('strokeplay','stableford','matchplay','scramble','no_counting'))
  and (nineteenth_order is null or nineteenth_order in ('weissbier','radler','spritz','gin_tonic','coffee','water_driving'))
  and coalesce(length(golf_motto), 0) <= 120
  and jsonb_typeof(memories) = 'object'
  and jsonb_typeof(bag) = 'object'
  and length(memories::text) <= 4000
  and length(bag::text) <= 2000
);

create table if not exists public.user_place_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  kind text not null,
  title_snapshot text null,
  slug_snapshot text null,
  destination_id text null,
  destination_title text null,
  destination_slug text null,
  country text null,
  played_on date null,
  created_at timestamptz not null default now(),
  unique (user_id, source_id, kind)
);

alter table public.user_place_marks drop constraint if exists user_place_marks_kind_check;
alter table public.user_place_marks add constraint user_place_marks_kind_check
  check (kind in ('played','bucket'));

create index if not exists idx_user_place_marks_user on public.user_place_marks(user_id, kind);
create index if not exists idx_user_place_marks_source on public.user_place_marks(source_id, kind);

alter table public.user_place_marks enable row level security;
drop policy if exists "user_place_marks_own" on public.user_place_marks;
create policy "user_place_marks_own" on public.user_place_marks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- New analytics events for Pass, Bucket List and the shareable Steckbrief.
alter table public.analytics_events drop constraint if exists analytics_events_event_name_check;
alter table public.analytics_events add constraint analytics_events_event_name_check
  check (event_name in (
    'page_viewed','content_viewed','story_read','search_performed',
    'content_saved','content_unsaved','save_limit_hint','save_limit_reached',
    'login_prompt_shown','login_prompt_dismissed','account_created',
    'trip_created','content_added_to_trip','trip_dates_set','booking_clicked',
    'onboarding_completed','onboarding_skipped','profile_updated',
    'place_played','place_bucketed','steckbrief_shared'
  ));
