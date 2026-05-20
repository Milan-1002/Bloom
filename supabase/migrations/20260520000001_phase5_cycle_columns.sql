-- Phase 5-01: Cycle-Synced Nutrition Targets — schema additions
-- Adds cycle tracking columns to profiles, cravings to symptom_logs,
-- and cycle_phase to ai_daily_targets.
-- All new columns are nullable so existing rows remain valid.

-- ── Block 1: profiles — cycle data columns ────────────────────────────────
alter table public.profiles
  add column last_period_date date;

comment on column public.profiles.last_period_date is
  'Date the user''s most recent period started. Null when user has not entered cycle data. Used by getCyclePhase() to compute current cycle day and phase.';

alter table public.profiles
  add column cycle_length_days integer default 28;

comment on column public.profiles.cycle_length_days is
  'Typical cycle length in days (range 21–45, default 28). Combined with last_period_date to compute current cycle phase via proportional phase boundaries.';

alter table public.profiles
  add column period_length_days integer default 5;

comment on column public.profiles.period_length_days is
  'Typical period (menstrual bleeding) length in days (range 3–8, default 5). Used for informational display; phase boundaries use fixed day-5 cutoff for menstrual phase.';

-- ── Block 2: symptom_logs — cravings dimension ────────────────────────────
alter table public.symptom_logs
  add column cravings smallint
  check (cravings between 1 and 5);

comment on column public.symptom_logs.cravings is
  '1–5 self-reported food craving intensity for the log date. 1 = none, 5 = very strong. Nullable — existing rows unaffected. Correlation with cycle phase deferred to Phase 6.';

-- ── Block 3: ai_daily_targets — cycle_phase storage ───────────────────────
alter table public.ai_daily_targets
  add column cycle_phase text;

comment on column public.ai_daily_targets.cycle_phase is
  'Cycle phase (menstrual | follicular | ovulation | luteal) in effect when these targets were generated. Null for pre-Phase-5 rows. Used by useAITargets hook to detect phase-drift and trigger regeneration.';
