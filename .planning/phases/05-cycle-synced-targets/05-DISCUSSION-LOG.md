# Phase 5: Cycle-Synced Nutrition Targets - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 5-cycle-synced-targets
**Areas discussed:** All four gray areas (user delegated all decisions to Claude)

---

## Cycle Data Entry

| Option | Description | Selected |
|--------|-------------|----------|
| Onboarding step | Add cycle data as a 5th onboarding step | |
| Profile settings | Add "My Cycle" section to existing profile settings screen | ✓ |
| Dedicated cycle tab | New tab in the nav bar for cycle tracking | |

**User's choice:** "you decide wherever is best" — Claude chose Profile settings.
**Notes:** Onboarding stays lean (4 steps). Cycle data is dynamic (monthly updates), so it belongs in profile settings alongside other profile fields. Updating the date naturally fires profile.updated_at → triggers target regeneration without extra code.

---

## Phase Change Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Background cron / server-side trigger | Supabase scheduled function checks phase daily | |
| Client-side detection on app open | useAITargets hook compares computed phase vs stored phase | ✓ |
| Manual "refresh targets" button | User taps refresh when they know their phase changed | |

**User's choice:** Delegated — Claude chose client-side detection.
**Notes:** Adding `cycle_phase text` to ai_daily_targets and comparing against the client-computed phase on every hook invocation is simple, reliable, and needs no server-side infrastructure. Phase transitions are detected automatically on next app open.

---

## Craving Interception UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline during food logging | Suggest low-GL swap when user searches for a high-GL food | |
| Dashboard tip card (Luteal only) | Conditional card on Today dashboard with 3 static swaps | ✓ |
| Dedicated cravings section | New screen or tab for craving management | |

**User's choice:** Delegated — Claude chose dashboard tip card.
**Notes:** Inline interception during food logging is intrusive and complex. A dedicated section adds nav complexity. A conditional dashboard card is contextual, low-friction, and fast (static content). Links to Recipes screen with Luteal filter pre-applied for users who want to explore further.

---

## Cycle-Specific Symptom Tracking

| Option | Description | Selected |
|--------|-------------|----------|
| Free-text notes on existing symptom log | User types notes about cravings alongside mood/energy | |
| New `cravings` dimension (1–5 slider) | Add cravings as a 6th structured symptom dimension | ✓ |
| Separate craving log with food associations | Link craving entries to specific foods logged | |

**User's choice:** Delegated — Claude chose the structured 1–5 slider.
**Notes:** Structured data (smallint column) enables Phase 6 correlation analysis. Free-text is unstructured and hard to aggregate. Food association linking is Phase 6 scope at the earliest.

---

## Claude's Discretion

All four gray areas were delegated ("you decide wherever is best"). Specific implementation details left to Claude during execution:
- Exact wording of the 3 Luteal comfort food swaps in the tip card
- Exact wording of per-phase bottom sheet educational copy
- Exact GL ceiling/floor delta values within the stated ranges (D-07)
- Component structure for CyclePhaseChip and LutealTipCard

## Deferred Ideas

- Cycle prediction for irregular cycles → v2
- Correlation timeline overlay → Phase 6 (Doctor-Ready Reports)
- Push notifications on phase change → out of scope (iOS PWA limitation)
- Coach-visible cycle data → v2
- Apple Health / Oura cycle sync → v2
- Ovulation prediction / LH tracking → v2
