-- AROUND Product Semantics v1.12
-- Applied to the live project on 2026-09-10.
alter table public.saved_items add column if not exists source_role text;
alter table public.user_collection_items add column if not exists source_role text;
alter table public.trip_items add column if not exists source_role text;

alter table public.saved_items drop constraint if exists saved_items_source_role_check;
alter table public.saved_items add constraint saved_items_source_role_check
  check (source_role is null or source_role in ('play','stay','eat','do'));

alter table public.user_collection_items drop constraint if exists user_collection_items_source_role_check;
alter table public.user_collection_items add constraint user_collection_items_source_role_check
  check (source_role is null or source_role in ('play','stay','eat','do'));

alter table public.trip_items drop constraint if exists trip_items_source_role_check;
alter table public.trip_items add constraint trip_items_source_role_check
  check (source_role is null or source_role in ('play','stay','eat','do'));
