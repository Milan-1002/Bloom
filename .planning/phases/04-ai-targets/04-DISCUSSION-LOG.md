# Phase 4: AI Targets — Claude Edge Function + Insulin Balance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 4-AI-Targets
**Areas discussed:** Prompt input scope, Output format, Insulin Balance score architecture, Cache invalidation strategy

---

## Gray Areas Presented

| Area | Options Offered | Selected |
|------|----------------|----------|
| Prompt input scope | Profile only / Profile + recent food_logs + symptom_logs | ✓ Claude's discretion |
| Output format | Structured JSON / Free-text with regex parsing | ✓ Claude's discretion |
| Insulin Balance score | Claude generates / Deterministic computation | ✓ Claude's discretion |
| Cache invalidation trigger | Any profile change / Key fields only / Hash-based | ✓ Claude's discretion |

---

## Claude's Discretion

User response: "you can decide whatever results in best outcomes"

All four gray areas were delegated to Claude. Decisions made:

- **Prompt input scope:** Profile-only in Phase 4 (pcos_type, goals, age, height_cm, weight). Food/symptom context deferred to future phase.
- **Output format:** Structured JSON with hard schema. Temperature 0 for reproducibility.
- **Insulin Balance score:** Claude generates the 0–100 score as a profile-level assessment. Added `insulin_score smallint` column via new migration (existing jsonb column insufficient for direct querying).
- **Cache strategy:** Edge Function is stateless (always generates). Cache-check logic belongs in Phase 04-02 client hook (timestamp comparison: `profiles.updated_at > ai_daily_targets.generated_at`).

---

## Deferred Ideas

- Food log / symptom context in Claude prompt — Phase 5+ enhancement
- Profile hash for granular cache invalidation — opted for simpler timestamp approach
- Score interpretation thresholds UI (color bands for 0-40 / 41-70 / 71-100) — Phase 04-02 design
