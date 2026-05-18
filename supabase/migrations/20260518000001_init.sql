-- supabase/migrations/20260518000001_init.sql

-- ── profiles ──────────────────────────────────────────────────────────────
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  display_name         text,
  age                  integer,
  height_cm            numeric(5,1),
  current_weight_kg    numeric(5,2),
  goal_weight_kg       numeric(5,2),
  pcos_type            text check (pcos_type in ('confirmed','suspected','managing')),
  goals                text[] default '{}',
  palette              text default 'slate' check (palette in ('slate','warm','sage')),
  dark_mode            boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
-- NOTE: No INSERT policy — profiles are created by trigger only

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── food_logs ──────────────────────────────────────────────────────────────
create table public.food_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_at   timestamptz not null default now(),
  meal_slot   text not null check (meal_slot in ('breakfast','lunch','dinner','snack')),
  food_name   text not null,
  fdc_id      text,
  serving_g   numeric(7,2) not null,
  kcal        numeric(7,2),
  protein_g   numeric(7,2),
  carbs_g     numeric(7,2),
  fat_g       numeric(7,2),
  fiber_g     numeric(7,2),
  sugar_g     numeric(7,2),
  gi          integer,
  gl          numeric(5,2),
  created_at  timestamptz default now()
);

create index food_logs_user_date_idx on public.food_logs (user_id, logged_at);

alter table public.food_logs enable row level security;

create policy "food_logs_select_own" on public.food_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "food_logs_insert_own" on public.food_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "food_logs_update_own" on public.food_logs
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "food_logs_delete_own" on public.food_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── weight_logs ───────────────────────────────────────────────────────────
-- log_date is set by the client to the user's local calendar date so the
-- unique constraint correctly enforces one entry per local day (not UTC day).
create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null default current_date,
  logged_at   timestamptz not null default now(),
  weight_kg   numeric(5,2) not null,
  created_at  timestamptz default now()
);

create unique index weight_logs_user_date_uniq
  on public.weight_logs (user_id, log_date);

alter table public.weight_logs enable row level security;

create policy "weight_logs_select_own" on public.weight_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "weight_logs_insert_own" on public.weight_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "weight_logs_update_own" on public.weight_logs
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "weight_logs_delete_own" on public.weight_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── symptom_logs ──────────────────────────────────────────────────────────
-- Same log_date pattern as weight_logs.
create table public.symptom_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null default current_date,
  logged_at   timestamptz not null default now(),
  energy      smallint check (energy between 1 and 5),
  mood        smallint check (mood between 1 and 5),
  sleep       smallint check (sleep between 1 and 5),
  bloating    smallint check (bloating between 1 and 5),
  skin        smallint check (skin between 1 and 5),
  created_at  timestamptz default now()
);

create unique index symptom_logs_user_date_uniq
  on public.symptom_logs (user_id, log_date);

alter table public.symptom_logs enable row level security;

create policy "symptom_logs_select_own" on public.symptom_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "symptom_logs_insert_own" on public.symptom_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "symptom_logs_update_own" on public.symptom_logs
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "symptom_logs_delete_own" on public.symptom_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── usda_foods (shared cache — no RLS) ───────────────────────────────────
create table public.usda_foods (
  fdc_id              text primary key,
  description         text not null,
  data_type           text,
  brand_owner         text,
  gtin_upc            text,
  kcal_per_100g       numeric(7,2),
  protein_g_per_100g  numeric(7,2),
  carbs_g_per_100g    numeric(7,2),
  fat_g_per_100g      numeric(7,2),
  fiber_g_per_100g    numeric(7,2),
  sugar_g_per_100g    numeric(7,2),
  raw_nutrients       jsonb,
  fetched_at          timestamptz default now(),
  expires_at          timestamptz default (now() + interval '30 days')
);

create index usda_foods_barcode_idx on public.usda_foods (gtin_upc)
  where gtin_upc is not null;

-- Intentionally no RLS: shared public cache, SELECT granted to authenticated
grant select on public.usda_foods to authenticated;

-- ── ai_daily_targets ──────────────────────────────────────────────────────
create table public.ai_daily_targets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  generated_at        timestamptz not null default now(),
  protein_g           numeric(6,2),
  fiber_g             numeric(6,2),
  gl_target           numeric(6,2),
  added_sugar_g       numeric(6,2),
  calorie_min         integer,
  calorie_max         integer,
  pc_ratio_target     numeric(4,2),
  insulin_score_basis jsonb,
  narrative           text,
  prompt_version      integer default 1,
  created_at          timestamptz default now()
);

create index ai_targets_user_idx on public.ai_daily_targets (user_id, generated_at desc);

alter table public.ai_daily_targets enable row level security;

create policy "ai_targets_select_own" on public.ai_daily_targets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_targets_insert_own" on public.ai_daily_targets
  for insert to authenticated with check ((select auth.uid()) = user_id);
