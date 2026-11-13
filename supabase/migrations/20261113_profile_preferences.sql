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
