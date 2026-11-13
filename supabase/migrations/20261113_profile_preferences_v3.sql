-- ==========================================================
-- Profile preferences v3 (2026-11-13): "1–2 Mal im Monat" as play
-- frequency, and a "flexibel" switch for travel months.
-- Additive.
-- ==========================================================
alter table public.profiles
  add column if not exists months_flexible boolean not null default false;

alter table public.profiles drop constraint if exists profiles_play_frequency_check;
alter table public.profiles add constraint profiles_play_frequency_check
  check (play_frequency is null or play_frequency in ('rarely','few_per_year','monthly','weekly','almost_daily'));
