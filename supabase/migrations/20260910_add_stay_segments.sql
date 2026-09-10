-- AROUND v1.13: STAY items are multi-night accommodation segments, not normal day stops.
alter table public.trip_items add column if not exists stay_start_day integer;
alter table public.trip_items add column if not exists stay_end_day integer;
alter table public.trip_items add column if not exists stay_full_trip boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trip_items_stay_start_day_nonnegative') then
    alter table public.trip_items add constraint trip_items_stay_start_day_nonnegative
      check (stay_start_day is null or stay_start_day >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trip_items_stay_end_day_nonnegative') then
    alter table public.trip_items add constraint trip_items_stay_end_day_nonnegative
      check (stay_end_day is null or stay_end_day >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trip_items_stay_range_valid') then
    alter table public.trip_items add constraint trip_items_stay_range_valid
      check (stay_start_day is null or stay_end_day is null or stay_end_day > stay_start_day);
  end if;
end $$;
