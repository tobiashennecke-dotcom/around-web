-- AROUND v1.26a.2: repository sync for the hardening already applied to
-- production as 20260916113506_my_around_foundation and
-- 20260916113639_my_around_foundation_security_hardening. No new DB
-- behavior beyond what production already has - idempotent, safe to run
-- once (or to re-run) against any environment.

-- Pin trigger helper search path.
alter function public.set_updated_at() set search_path to public;

-- Internal auth bootstrap trigger function must never be publicly callable -
-- it only ever needs to run as the trigger owner inside the auth.users
-- insert path, never via a direct RPC call from any role.
revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.handle_new_auth_user() from authenticated;

-- Cover Trip-related foreign keys.
create index if not exists idx_trip_items_trip_id
  on public.trip_items(trip_id);

create index if not exists idx_user_events_trip_id
  on public.user_events(trip_id)
  where trip_id is not null;
