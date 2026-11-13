-- ==========================================================
-- analytics_events (Phase 3, approved 2026-11-13)
-- Consent-aware product analytics, incl. guests. Separate from
-- public.user_events, which stays the account history that feeds the
-- consent-gated Brevo lifecycle layer.
--
-- consent = 'anonymous': no anon_id, no user_id (no consent given).
-- consent = 'full': anon_id from the browser, user_id once linked.
--
-- Written only server-side (/api/events with the secret key). RLS is on
-- and there are deliberately NO policies: the browser can neither read
-- nor write this table.
-- ==========================================================
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  event_name text not null,
  consent text not null,
  anon_id uuid null,
  user_id uuid null references auth.users(id) on delete cascade,
  path text null,
  source_id text null,
  source_type text null,
  source_role text null,
  slug text null,
  query text null,
  value numeric null,
  trip_id uuid null,
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  referrer_host text null
);

alter table public.analytics_events drop constraint if exists analytics_events_event_name_check;
alter table public.analytics_events add constraint analytics_events_event_name_check
  check (event_name in (
    'page_viewed','content_viewed','story_read','search_performed',
    'content_saved','content_unsaved','save_limit_hint','save_limit_reached',
    'login_prompt_shown','login_prompt_dismissed','account_created',
    'trip_created','content_added_to_trip','trip_dates_set','booking_clicked',
    'onboarding_completed','onboarding_skipped','profile_updated'
  ));

alter table public.analytics_events drop constraint if exists analytics_events_consent_check;
alter table public.analytics_events add constraint analytics_events_consent_check
  check (
    (consent = 'anonymous' and anon_id is null and user_id is null)
    or consent = 'full'
  );

alter table public.analytics_events drop constraint if exists analytics_events_source_type_check;
alter table public.analytics_events add constraint analytics_events_source_type_check
  check (source_type is null or source_type in ('destination','place','story','person','object','collection'));

create index if not exists idx_analytics_events_occurred_at on public.analytics_events(occurred_at desc);
create index if not exists idx_analytics_events_name_time on public.analytics_events(event_name, occurred_at desc);
create index if not exists idx_analytics_events_anon_id on public.analytics_events(anon_id) where anon_id is not null;
create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id) where user_id is not null;

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
