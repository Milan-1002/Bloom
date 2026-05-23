# Phase 6 UAT — Automated "Doctor-Ready" Reports

**Generated:** 2026-05-23
**Phase:** 6 of 6
**Plans covered:** 06-01 (data layer), 06-02 (UI), 06-03 (PDF export)
**App URL:** http://localhost:5173 (dev) or deployed URL

---

## Pre-conditions

- Signed in as a test user with an existing profile
- ≥7 days of food logs exist in the database (required for SC-1, SC-2, SC-3, SC-4 — use 30d window)
- At least 1 symptom log entry exists (for SC-2)
- At least 2 weight log entries exist in the window (for SC-1 weight change)
- Cycle data configured in Profile > My Cycle (for SC-1 cycle length)

---

## Success Criteria

### SC-1 — 30/60/90-day summary statistics at a glance

**Requirement:** RPT-01 — A user can generate a 30-, 60-, or 90-day summary showing average GL, fiber, weight change, and cycle length at a glance.

**Steps:**
1. Navigate to Home screen
2. Scroll to bottom and tap "View Health Report"
3. Verify the /report screen opens with the 30d window selected by default
4. Confirm the 2×2 stat grid shows: **Avg Daily GL** (number + "GL" unit), **Avg Fiber** (number + "g/day"), **Weight Change** (kg or "—" if insufficient data), **Cycle Length** (days or "—" if not configured)
5. Tap "60d" in the window picker — verify all four stat cards update to the 60-day aggregation
6. Tap "90d" — verify all four stat cards update to the 90-day aggregation

**Expected:** 4 stat cards visible on each window. Values are non-zero for a user with ≥7 days of food logs. Trend indicators (▲/▼/→) appear on GL and Fiber cards.

**Pass criteria:**
- [ ] All 4 stat cards render with real values (not all "—" or all 0)
- [ ] Window picker switches between 30d / 60d / 90d and stat values change accordingly
- [ ] Weight Change shows "—" (not 0) when fewer than 2 weight logs exist in the window
- [ ] Cycle Length shows "—" when cycle not configured in profile

---

### SC-2 — GL vs symptom timeline

**Requirement:** RPT-02 — A timeline view overlays logged symptoms directly on the GL graph to reveal diet–symptom correlations.

**Steps:**
1. On the /report screen with a 30d window, scroll below the stat cards
2. Locate the "GL & SYMPTOM TIMELINE" chart card
3. Verify the ComposedChart renders with:
   - A teal/blue **GL line** showing daily glycemic load values
   - Coloured **symptom dots**: coral for low scores (<3), mint/green for high scores (≥3)
   - Date labels on the x-axis (weekly ticks for 30d)
4. If red-flag streaks exist: verify a **coral shaded area** appears behind the relevant date range

**Expected:** Chart renders without errors. GL line is visible when food logs exist. Symptom dots appear on days with symptom entries. Shaded red-flag areas appear for periods exceeding GL target by ≥20% for 5+ days.

**Pass criteria:**
- [ ] Chart is visible and not blank/broken
- [ ] GL line connects data points where food logs exist; gaps appear on days without logs
- [ ] At least one symptom dot is visible (requires ≥1 symptom log entry)
- [ ] Days with composite symptom score <3 show coral dots; ≥3 show mint dots
- [ ] Red-flag ReferenceArea shading appears if ≥5 consecutive days exceeded GL target by ≥20%

---

### SC-3 — Meal timing patterns

**Requirement:** RPT-03 — The report highlights typical eating patterns — average fasting window, meal timing distribution.

**Steps:**
1. On the /report screen, scroll below the chart
2. Locate the "MEAL PATTERNS" card
3. Verify the following are displayed:
   - Avg eating window (e.g., "10h 30m")
   - Avg first meal time (e.g., "8:15am")
   - Avg last meal time (e.g., "6:45pm")
   - Avg fasting window (e.g., "13h 30m")
4. Verify the meal distribution bar shows 4 coloured segments (Breakfast, Lunch, Dinner, Snack) with percentage labels
5. Switch to 90d window — verify values update

**Expected:** Meal timing section shows real calculated values when food logs contain timestamp data with ≥2 meals on at least one day. Distribution bar segments reflect the proportion of meal slot entries.

**Pass criteria:**
- [ ] Avg eating window, first meal, last meal, and fasting window are all displayed with real values
- [ ] "Not enough data to calculate meal timing" fallback appears only when no day has ≥2 log entries
- [ ] Meal distribution percentages sum to approximately 100%
- [ ] Four slot labels (Breakfast, Lunch, Dinner, Snack) with % values are visible

---

### SC-4 — Red-flag streak detection

**Requirement:** RPT-04 — "Red flag" streaks (5+ consecutive days exceeding GL target by ≥20%) are automatically flagged.

**Steps:**
1. On the /report screen, scroll to see if a **"High GL Periods"** callout card appears (only visible when red-flag streaks were detected)
2. If the card is present, verify:
   - ⚠️ icon and "High GL Periods" heading
   - List of streak entries with: start date, end date, number of days, avg overage percentage
   - Example: "15 Jan – 22 Jan (8 days) — GL averaged 42% above target"
3. If no streaks exist for the test user, verify the callout card is **absent** (not shown as empty)

**Expected:** Red-flag card is conditionally rendered — shown only when `redFlagStreaks.length > 0`. When present, each streak shows human-readable date range and overage details.

**Pass criteria:**
- [ ] Red-flag card is hidden when no streaks exist (no empty card placeholder)
- [ ] Red-flag card appears when streaks are detected, showing streak count in the heading
- [ ] Each streak row shows start date, end date, day count, and avg overage percentage
- [ ] Overage is shown as a percentage (e.g., "42% above target"), not a raw GL number

---

### SC-5 — PDF export

**Requirement:** RPT-05 — The complete report exports to a clean PDF the user can email or print for their clinic visit.

**Steps:**
1. Navigate to the /report screen with ≥7 days of food logs loaded (30d window)
2. Tap the **share/export icon** in the top-right of the AppBar
3. Observe the button state:
   - Button should show a **spinning indicator** while generating
   - Button should be **dimmed** (opacity 50%) and non-interactive during generation
4. Wait 3–10 seconds for PDF generation to complete
5. On mobile (iOS/Android): the native OS share sheet should appear with the PDF file
   On desktop: a file named `bloom-report-30d-YYYY-MM-DD.pdf` should download automatically
6. Open the downloaded PDF and verify it contains:
   - **Page 1:** "Bloom Health Report" title in violet, subtitle with window + date + days with data
   - **Summary section:** Avg Daily GL, Avg Fiber, Weight Change, Cycle Length (if configured)
   - **GL & Symptom Timeline section:** chart image embedded as PNG
   - **High GL Periods section:** present only if red-flag streaks exist
   - **Meal Patterns section:** eating window, meal times, fasting window, slot distribution percentages
   - **Footer:** "Generated by Bloom — PCOS Nutrition Companion · {date}"

**Edge case (no data):**
7. Tap the Export PDF button when `stats = null` (e.g., empty state / loading) — button should return early with no action and no error

**Pass criteria:**
- [ ] Export button shows SpinnerIcon while generating; ShareIcon when idle
- [ ] Export button is pointer-events-none and opacity-50 during generation
- [ ] PDF file is named `bloom-report-30d-YYYY-MM-DD.pdf` (where date = today)
- [ ] PDF opens without error in a standard PDF viewer
- [ ] PDF title page shows "Bloom Health Report" in violet
- [ ] Summary stat boxes are present with real values
- [ ] Chart image (PNG) is embedded and visible — not blank or broken
- [ ] Red-flag section present only if streaks exist
- [ ] Meal patterns section shows timing and distribution data
- [ ] Footer text present at bottom of page
- [ ] Export button does nothing (graceful no-op) when stats = null

---

## Regression Checks

After completing SC-1 through SC-5, verify no regressions:

- [ ] Home screen still shows "View Health Report" CTA button and navigates to /report
- [ ] Navigating to other tabs (Today, Log, etc.) still works after visiting /report
- [ ] App does not crash or throw console errors during normal usage
- [ ] npx tsc --noEmit passes with 0 errors

---

## UAT Sign-off

| Criteria | Status | Notes |
|----------|--------|-------|
| SC-1: 30/60/90d summary stats | | |
| SC-2: GL vs symptom timeline | | |
| SC-3: Meal timing patterns | | |
| SC-4: Red-flag streak detection | | |
| SC-5: PDF export | | |
| Regressions | | |

**Overall Phase 6 result:** [ ] PASS — all 5 success criteria met  /  [ ] FAIL — issues found (see notes)
