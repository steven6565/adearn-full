-- AdEarn v1 — Supabase / Postgres schema
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run.
-- Tables match the spec: users, ad_views, transactions.

create table if not exists users (
  id bigint generated always as identity primary key,
  telegram_id bigint unique not null,
  username text,
  first_name text,
  photo_url text,
  total_credits integer not null default 0 check (total_credits >= 0),
  created_at timestamptz not null default now()
);

create table if not exists ad_views (
  id bigint generated always as identity primary key,
  user_id bigint not null references users(id) on delete cascade,
  ad_id text not null,
  provider text not null default 'monetag',
  -- The provider's own event id (Monetag ymid). UNIQUE = no double reward,
  -- even if the provider retries its postback many times.
  provider_event_id text unique,
  reward integer not null default 1 check (reward > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id bigint generated always as identity primary key,
  user_id bigint not null references users(id) on delete cascade,
  type text not null check (type in ('earn', 'spend', 'adjust')),
  amount integer not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists ad_views_user_idx on ad_views (user_id, created_at desc);
create index if not exists transactions_user_idx on transactions (user_id, created_at desc);

-- Security: the backend uses the service-role / direct Postgres connection,
-- so Row Level Security is left OFF for these tables. Never expose the
-- service-role key or DATABASE_URL to the frontend. The frontend only talks
-- to the Express backend, which verifies Telegram initData on every call.
