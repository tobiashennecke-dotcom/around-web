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
