-- AROUND v1.14: planning readiness and intentional no-STAY nights
alter table public.trips add column if not exists plan_ready boolean not null default false;
alter table public.trips add column if not exists stay_exempt_nights integer[] not null default '{}'::integer[];
