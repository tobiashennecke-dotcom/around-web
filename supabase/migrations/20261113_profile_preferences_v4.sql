-- ==========================================================
-- Profile preferences v4 (2026-11-13): trip length and organizer role
-- become multiple choice. Replaces the unreleased single-choice columns
-- trip_length / organizer_role (existing test values carried over).
-- ==========================================================
alter table public.profiles
  add column if not exists trip_lengths text[] not null default '{}',
  add column if not exists organizer_roles text[] not null default '{}';

update public.profiles set trip_lengths = array[trip_length]
  where trip_length is not null and cardinality(trip_lengths) = 0;
update public.profiles set organizer_roles = array[organizer_role]
  where organizer_role is not null and cardinality(organizer_roles) = 0;

alter table public.profiles drop constraint if exists profiles_trip_length_check;
alter table public.profiles drop constraint if exists profiles_organizer_role_check;
alter table public.profiles drop column if exists trip_length;
alter table public.profiles drop column if exists organizer_role;

alter table public.profiles drop constraint if exists profiles_trip_lengths_check;
alter table public.profiles add constraint profiles_trip_lengths_check
  check (trip_lengths <@ array['weekend','4_5_days','week','longer']::text[]);

alter table public.profiles drop constraint if exists profiles_organizer_roles_check;
alter table public.profiles add constraint profiles_organizer_roles_check
  check (
    organizer_roles <@ array['none','friends','captain_men','captain_women','captain_seniors','captain_youth_mixed','club','professional']::text[]
    and not ('none' = any(organizer_roles) and cardinality(organizer_roles) > 1)
  );
