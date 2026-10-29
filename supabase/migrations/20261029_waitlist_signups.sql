-- AROUND: Warteliste (Early Access) für die Teaser-Seite thisisaround.de.
-- Additiv. Berührt keine bestehende Tabelle.
-- Zugriff ausschließlich serverseitig über den Service-Role-Key
-- (Vercel Function im Projekt around-teaser). Keine Policies für anon/authenticated.

create table if not exists public.waitlist_signups (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  first_name         text not null,
  status             text not null default 'pending',
  confirm_token_hash text,
  consent_text       text not null,
  source             text not null default 'teaser',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  confirmed_at       timestamptz,
  unsubscribed_at    timestamptz,
  constraint waitlist_signups_status_check
    check (status in ('pending', 'confirmed', 'unsubscribed')),
  constraint waitlist_signups_email_format
    check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  constraint waitlist_signups_first_name_length
    check (length(btrim(first_name)) between 1 and 80)
);

comment on table public.waitlist_signups is
  'Early-Access-Warteliste der Teaser-Seite. Double-Opt-in: status pending -> confirmed. Nachweis über consent_text, created_at, confirmed_at.';

create unique index if not exists waitlist_signups_email_key
  on public.waitlist_signups (email);

create unique index if not exists waitlist_signups_confirm_token_hash_key
  on public.waitlist_signups (confirm_token_hash)
  where confirm_token_hash is not null;

drop trigger if exists waitlist_signups_set_updated_at on public.waitlist_signups;
create trigger waitlist_signups_set_updated_at
  before update on public.waitlist_signups
  for each row execute function public.set_updated_at();

alter table public.waitlist_signups enable row level security;

revoke all on table public.waitlist_signups from anon;
revoke all on table public.waitlist_signups from authenticated;
