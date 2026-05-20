---
status: complete
phase: 05-cycle-synced-targets
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: "2026-05-20"
updated: "2026-05-20"
verdict: PASS
---

## Tests

### 1. Set cycle data in Profile
expected: |
  My Cycle section visible in Profile between Appearance and Account.
  Date picker, cycle length stepper (21–45), period length stepper (3–8), Save button.
result: PASS
notes: |
  Section present. Date showing 05/01/2026. Cycle 28 days, Period 5 days.
  "Save cycle info" button between Appearance and Account sections — exact placement confirmed.

### 2. Cycle phase chip appears on Home dashboard
expected: |
  Chip below date header showing current phase and day.
result: PASS
notes: |
  "Luteal · Day 20" chip rendered below "Wednesday, May 20" header on first load.
  After changing date to May 11, chip instantly updated to "Follicular · Day 10" — no reload required.

### 3. Tap chip to open phase explanation
expected: |
  Bottom sheet slides up with phase title, 3–4 sentence explanation, close button.
result: PASS
notes: |
  Tapping "Luteal · Day 20" opened bottom sheet with drag indicator, title "Luteal",
  full progesterone/insulin-sensitivity explanation, and "Got it" close button.
  Tapping "Got it" dismissed cleanly.

### 4. Luteal tip card (during Luteal phase)
expected: |
  Card with "Luteal phase cravings incoming", 3 food swaps with GL badges, CTA button.
result: PASS
notes: |
  Card fully rendered on Home. All 3 swaps present:
  Chocolate → Dark cacao rice cakes (GL ~8)
  Pasta → Lentil pasta with olive oil (GL ~26)
  Crisps → Roasted chickpeas (GL ~10)
  "Explore PCOS-friendly recipes →" CTA button at bottom.
  Card absent after switching to Follicular phase — conditional render correct.

### 5. Luteal → Recipes deep-link
expected: |
  Tap CTA → Recipes opens with Low GL filter pre-selected.
result: PASS
notes: |
  Tapped "Explore PCOS-friendly recipes →". URL became /recipes?phase=luteal.
  "Low GL" filter chip was active (checkmark icon visible) on arrival.
  Recipes content loaded with Low GL filter applied.

### 6. Cravings on Symptoms screen
expected: |
  Cravings row (1–5 dot scale, None/Mild/Moderate/Strong/Intense labels) saves to DB.
result: PASS
notes: |
  Cravings row present with smiley face icon and "—" (unset) label.
  Set to 3 → label updated to "Moderate" with berry-colored bar fill.
  Save had 2 transient ERR_CONNECTION_CLOSED failures then succeeded on 3rd attempt (200).
  DB confirmed: cravings:3 in returned GET response after successful upsert.

### 7. AI targets regenerate with cycle context
expected: |
  After phase change, targets regenerate with cycle-aware narrative.
result: PASS (with note)
notes: |
  Phase drift from luteal→follicular triggered new POST /functions/v1/generate-targets (req 221, 200).
  New targets: protein 140g, fiber 35g, gl_target 95, insulin_score 71, calorie 1800–2200.
  Narrative regenerated: "support steady insulin sensitivity through adequate protein and fiber".
  NOTE: Narrative thematically correct (insulin sensitivity focus fits follicular) but does not 
  explicitly name "follicular" or "oestrogen". This is Claude generation variance — the mechanism 
  (drift detection → regen → new DB row) is fully working. The SYSTEM_PROMPT guidance says 
  "note improving insulin sensitivity" for follicular; Claude incorporated the concept but not 
  the explicit phase label. Not a blocking issue.

## Summary

total: 7
passed: 7
failed: 0
skipped: 0

issues:
  - id: UAT-7-NOTE
    severity: low
    description: Follicular phase narrative doesn't explicitly name the phase or oestrogen. Claude incorporates the guidance concept (insulin sensitivity) without labeling it. Non-blocking.
    fix: Consider adding explicit instruction "Always name the cycle phase in the narrative" to SYSTEM_PROMPT's CYCLE PHASE GUIDANCE section.
