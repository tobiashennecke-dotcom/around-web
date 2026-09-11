alter table public.trip_items
  add column if not exists is_fixed boolean not null default false,
  add column if not exists fixed_time time without time zone,
  add column if not exists duration_minutes integer,
  add column if not exists booking_state text not null default 'none';

alter table public.trip_items
  drop constraint if exists trip_items_duration_minutes_check;
alter table public.trip_items
  add constraint trip_items_duration_minutes_check
  check (duration_minutes is null or (duration_minutes >= 15 and duration_minutes <= 1440));

alter table public.trip_items
  drop constraint if exists trip_items_booking_state_check;
alter table public.trip_items
  add constraint trip_items_booking_state_check
  check (booking_state in ('none','requested','confirmed'));
