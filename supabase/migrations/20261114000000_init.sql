-- Schema for the review-app database (mirrors db/schema.ts).
-- Row Level Security is on with no policies: the public anon key can read
-- nothing. Only the server (service role key) accesses these tables.

create table if not exists public.attendance (
  id text primary key,
  date text not null,
  type text not null,
  payload jsonb not null,
  unique (type, date)
);

create table if not exists public.calendar_events (
  id text primary key,
  date text not null,
  category text not null,
  time text not null default '',
  location text not null default '',
  note text not null default ''
);

create table if not exists public.calendar_categories (
  name text primary key
);

alter table public.attendance enable row level security;
alter table public.calendar_events enable row level security;
alter table public.calendar_categories enable row level security;
