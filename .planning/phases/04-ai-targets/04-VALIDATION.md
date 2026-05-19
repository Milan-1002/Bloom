---
phase: 4
slug: 04-ai-targets
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-18
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (existing — `vitest.config.ts` present) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/ai/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/ai/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-W0a | 01 | 0 | AI-01 | — | Migration file present before any TypeScript references `insulin_score` | manual | `ls supabase/migrations/20260518000002_ai_targets_insulin_score.sql` | ❌ W0 | ⬜ pending |
| 04-01-W0b | 01 | 0 | INFRA-04 | — | `database.types.ts` contains `insulin_score` after type regen | unit | `grep -q "insulin_score" src/lib/database.types.ts && echo PASS` | ❌ W0 | ⬜ pending |
| 04-01-1 | 01 | 1 | AI-05 | T-04-01-01 | `validateTargets` throws on out-of-range values and cross-field violations | unit | `npx vitest run tests/ai/ai-validation.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-2 | 01 | 1 | AI-05 | T-04-01-02 | `checkForbidden` throws on forbidden medical terms | unit | `npx vitest run tests/ai/ai-validation.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-3 | 01 | 1 | AI-01 | — | `buildUserPrompt` omits user_id; includes all 6 profile fields | unit | `npx vitest run tests/ai/ai-validation.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-4 | 01 | 1 | AI-06 | T-04-01-03 | `ANTHROPIC_API_KEY` not present in any Vite env file | manual | `grep -r "ANTHROPIC" .env* src/ 2>/dev/null | grep -v "NEVER" || echo PASS` | — | ⬜ pending |
| 04-01-5 | 01 | 2 | AI-01, AI-02, AI-03 | — | Edge Function returns valid JSON with all 10 required fields on success | integration | Manual invocation via `supabase functions serve` + curl | ❌ W0 (local stack) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `supabase/migrations/20260518000002_ai_targets_insulin_score.sql` — migration adding `insulin_score smallint` + check constraint
- [ ] `tests/ai/ai-validation.test.ts` — test stubs for `validateTargets`, `checkForbidden`, `buildUserPrompt` (all failing — TDD RED phase)
- [ ] `src/lib/ai-validation.ts` — stub file (empty exports) so imports resolve during test run
- [ ] Migration applied to Supabase project + `src/lib/database.types.ts` regenerated

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `ANTHROPIC_API_KEY` registered as Edge Function secret | AI-06 | Supabase secrets cannot be checked programmatically from the repo | `supabase secrets list` — confirm `ANTHROPIC_API_KEY` appears |
| Edge Function returns HTTP 401 without Authorization header | AI-01 | Requires live Supabase local stack | `curl -X POST http://localhost:54321/functions/v1/generate-targets` → expect 401 |
| Edge Function returns HTTP 400 for profile with null pcos_type | AI-01 | Requires live local stack with test user | Create user with no pcos_type → invoke function → expect `{ error: "profile_required" }` |
| Edge Function returns HTTP 500 on Claude API error (key removed) | AI-05 | Requires live stack with invalid API key | Set wrong key → invoke → expect 500 with no targets in response |
| Full end-to-end: valid profile → Claude call → row inserted in ai_daily_targets | AI-01, AI-02, AI-03 | Requires live local stack + real API key | Invoke with valid user → check Supabase table for new row |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
