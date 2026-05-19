---
phase: "01"
plan: "02"
subsystem: "foundation"
tags: ["supabase", "rls", "migrations", "typescript-types", "singleton-client"]
dependency_graph:
  requires:
    - "01-01 (scaffold + @supabase/supabase-js installed)"
  provides:
    - "All 6 Supabase tables applied to cloud project nfyqateokdecjttimrhy"
    - "RLS policies on 5 user-owned tables using (select auth.uid())"
    - "profiles auto-create trigger (handle_new_user)"
    - "Generated src/lib/database.types.ts typed against live schema"
    - "src/lib/supabase.ts singleton client (only file calling createClient)"
  affects:
    - "01-03 (AuthContext uses supabase singleton)"
    - "All subsequent plans that query the database"
tech_stack:
  patterns:
    - "RLS: (select auth.uid()) = user_id on all user policies — prevents per-row function evaluation"
    - "profiles: trigger-only insert — no INSERT policy for authenticated role"
    - "weight_logs/symptom_logs: explicit log_date date column for unique-per-day constraint"
    - "supabase.ts: module-level singleton, throws on missing env vars"
key_files:
  created:
    - "supabase/migrations/20260518000001_init.sql"
    - "src/lib/database.types.ts"
    - "src/lib/supabase.ts"
decisions:
  - "Added explicit log_date date column to weight_logs and symptom_logs instead of indexing date(logged_at::timestamptz) — PostgreSQL requires IMMUTABLE functions in index expressions; date(timestamptz) is NOT immutable (timezone-dependent). Explicit log_date is also better design: client sets the user's local calendar date, not the UTC date."
  - "Migration applied directly via Supabase MCP (apply_migration) — Docker not available; linked CLI not used."
  - "database.types.ts originally had UTF-16 BOM from prior stub; converted to UTF-8 for grep/tooling compatibility while keeping TypeScript happy."
metrics:
  duration: "~15 minutes"
  completed: "2026-05-18"
  tasks_completed: 3
  files_created: 3
---

# Phase 01 Plan 02: Supabase Schema + RLS + Singleton Client

**One-liner:** All 6 Bloom tables applied to Supabase cloud with RLS, auto-profile trigger, generated TypeScript types, and a typed singleton client.

## What Was Built

### Migration Applied (supabase/migrations/20260518000001_init.sql)

| Table | RLS | Key constraint |
|-------|-----|----------------|
| `profiles` | yes | trigger-only insert; select+update policies |
| `food_logs` | yes | 4 CRUD policies; composite index on (user_id, logged_at) |
| `weight_logs` | yes | unique on (user_id, log_date); log_date is explicit date column |
| `symptom_logs` | yes | unique on (user_id, log_date); energy/mood/sleep/bloating/skin 1–5 |
| `usda_foods` | no (shared cache) | SELECT granted to authenticated; barcode index |
| `ai_daily_targets` | yes | select + insert policies; desc index on (user_id, generated_at) |

RLS count: 5 tables. `(select auth.uid())` usage: 17 occurrences (all policies use the cached form).

### src/lib/database.types.ts

Generated from the live Supabase schema via MCP `generate_typescript_types`. Contains Row/Insert/Update shapes for all 6 tables plus the standard helper types (Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes).

### src/lib/supabase.ts

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
// reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY, throws on missing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

Only file in the codebase that calls `createClient`. ESLint `no-restricted-imports` rule from 01-01 enforces this.

## Deviations from Plan

**Schema change — log_date date column (auto-fixed)**
- **Issue:** `date(logged_at)` in unique index fails with `ERROR: 42P17: functions in index expression must be marked IMMUTABLE`. PostgreSQL's `date(timestamptz)` is not immutable because it depends on the `TimeZone` GUC.
- **Fix:** Added explicit `log_date date not null default current_date` column to `weight_logs` and `symptom_logs`. Unique index uses `(user_id, log_date)` directly — no function call.
- **Benefit:** Also better design — client can pass the user's local calendar date rather than relying on UTC day boundaries.
- **Files modified:** `supabase/migrations/20260518000001_init.sql`

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "enable row level security" migration` | 5 |
| `grep -c "(select auth.uid())" migration` | 17 |
| `grep -c "on delete cascade" migration` | 5 |
| `grant select on public.usda_foods` present | yes |
| `on_auth_user_created` trigger present | yes |
| No INSERT policy for `profiles` authenticated role | confirmed |
| `export type Database` in database.types.ts | yes |
| `export const supabase` in supabase.ts | yes |
| `npx tsc --noEmit` | 0 errors |
| Supabase Dashboard — 6 tables visible | confirmed via MCP list_tables |

## Threat Model Compliance

| Threat | Mitigation Applied |
|--------|-------------------|
| T-02-01: Cross-user data access | RLS `(select auth.uid()) = user_id` on all 5 user tables |
| T-02-02: RLS with-check bypass | All INSERT/UPDATE policies include WITH CHECK clause |
| T-02-03: profiles INSERT from client | No INSERT policy for authenticated; trigger-only insert |
| T-02-04: usda_foods cache poisoning | SELECT-only grant to authenticated; INSERT requires service role |

## Self-Check: PASSED
