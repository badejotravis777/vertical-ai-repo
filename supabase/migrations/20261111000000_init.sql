-- Deal Check database.
--
-- profiles     one row per account, holds the plan (free or pro)
-- deal_checks  every check: results only, never the raw deal text
-- deal_benchmark()  what similar creators were offered, from real checks

-- ---------- Profiles ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- No update policy: only you (or a payment webhook using the service role)
-- can move someone to Pro.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Deal checks ----------
--
-- Written only by the `deal-check` Edge Function (service role), so nobody
-- can fake rows to skew the benchmark or reset their free checks.
-- Signed-in people can read their own history. Checks made without an
-- account carry a salted hash of the visitor's IP (anon_id) instead of a
-- user id, used only to limit free checks.

create table if not exists public.deal_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  anon_id text,
  created_at timestamptz not null default now(),

  title text,
  platform text,
  niche text,
  country text,
  currency text,
  followers integer,
  followers_band text,
  avg_views integer,
  engagement_rate numeric,

  deliverable_count integer,
  offered_fee numeric,
  offered_per_deliverable numeric,
  fair_rate_low numeric,
  fair_rate_high numeric,
  verdict text check (verdict in ('take_it', 'negotiate', 'walk_away')),
  deal_score integer,
  scam_risk text,

  result jsonb not null,

  constraint deal_checks_owner check (user_id is not null or anon_id is not null)
);

create index if not exists deal_checks_user_created_idx
  on public.deal_checks (user_id, created_at desc);

create index if not exists deal_checks_anon_created_idx
  on public.deal_checks (anon_id, created_at desc);

create index if not exists deal_checks_benchmark_idx
  on public.deal_checks (platform, followers_band, currency);

alter table public.deal_checks enable row level security;

drop policy if exists "Read own deal checks" on public.deal_checks;
create policy "Read own deal checks"
  on public.deal_checks for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------- Benchmark ----------
--
-- What creators of a similar size on the same platform were actually offered,
-- per deliverable, over the last 12 months. Returns no row until at least five
-- offers exist, so a single person's deal can never be singled out.

create or replace function public.deal_benchmark(
  p_platform text,
  p_band text,
  p_currency text
)
returns table (
  sample_size bigint,
  offered_p25 numeric,
  offered_median numeric,
  offered_p75 numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) as sample_size,
    round(percentile_cont(0.25) within group (order by offered_per_deliverable)::numeric, 2),
    round(percentile_cont(0.50) within group (order by offered_per_deliverable)::numeric, 2),
    round(percentile_cont(0.75) within group (order by offered_per_deliverable)::numeric, 2)
  from public.deal_checks
  where platform = p_platform
    and followers_band = p_band
    and currency = p_currency
    and offered_per_deliverable is not null
    and offered_per_deliverable > 0
    and created_at > now() - interval '12 months'
  having count(*) >= 5;
$$;

revoke all on function public.deal_benchmark(text, text, text) from public, anon;
grant execute on function public.deal_benchmark(text, text, text) to authenticated, service_role;
