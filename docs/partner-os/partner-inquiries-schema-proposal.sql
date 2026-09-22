-- PROPOSAL ONLY: do not apply to production before review.
-- Partner inquiries are private CRM records; public submissions pass through a server route.
create table if not exists public.partner_inquiries (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 organization_name text not null check (char_length(organization_name) between 2 and 160),
 contact_name text not null check (char_length(contact_name) between 2 and 120),
 email text not null check (char_length(email) between 5 and 200),
 website text check (website is null or char_length(website) <= 300),
 message text check (message is null or char_length(message) <= 2000),
 plan_id text not null check (plan_id in ('essential','featured','signature','discover','explore','destination')),
 founding_requested boolean not null default false,
 addon_ids text[] not null default '{}',
 quoted_total_eur integer not null check (quoted_total_eur >= 0),
 status text not null default 'new' check (status in ('new','qualified','contacted','proposal','won','lost')),
 source text not null default 'partner_site',
 constraint partner_inquiries_addons_valid check (addon_ids <@ array['story','reel','package']::text[])
);
create index if not exists partner_inquiries_created_idx on public.partner_inquiries (created_at desc);
create index if not exists partner_inquiries_status_idx on public.partner_inquiries (status, created_at desc);
alter table public.partner_inquiries enable row level security;
revoke all on public.partner_inquiries from anon, authenticated;
-- No client-side policies. A server-only Supabase secret key is used for submissions.
-- Admin CRM access will be added separately with verified authorization.
