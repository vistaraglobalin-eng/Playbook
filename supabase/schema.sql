-- Aviator 3D practice/demo database
-- Virtual credits only.
-- No real-money wagering, payouts or settlement.

create table if not exists public.aviator_practice_rounds (
  id uuid primary key default gen_random_uuid(),

  round_number bigint not null,

  crash_multiplier numeric(10,2) not null
    check (crash_multiplier >= 1),

  created_at timestamptz not null default now()
);

create index if not exists
  aviator_practice_rounds_created_at_idx
on public.aviator_practice_rounds (created_at desc);

alter table public.aviator_practice_rounds
enable row level security;

drop policy if exists
  "practice rounds are readable"
on public.aviator_practice_rounds;

create policy
  "practice rounds are readable"
on public.aviator_practice_rounds
for select
using (true);

-- No insert/update/delete policies are created.
-- Keep service_role keys out of frontend code.
