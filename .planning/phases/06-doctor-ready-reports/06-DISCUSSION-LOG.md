# Phase 6: Doctor-Ready Reports - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 06-doctor-ready-reports
**Areas discussed:** Report location & navigation, Time window UX, GL + symptom timeline chart, PDF export approach

---

## Report location & navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Insights tab (replace it) | Reports takes the unbuilt Insights tab slot in tab bar — prominent, easy to find | |
| Inside Me / Profile tab | Reports as a section in Profile screen — no tab bar change | |
| Home screen CTA button | A "Generate Report" button on the Today dashboard leads to a full-screen route | ✓ |

**User's choice:** Home screen CTA button

| Sub-question: How does it open? | Description | Selected |
|----------------------------------|-------------|----------|
| Full-screen push route | New /report route pushed onto router stack — back navigation via header | ✓ |
| Bottom sheet / modal overlay | Large bottom sheet slides up over Home screen | |
| You decide | Claude picks | |

**User's choice:** Full-screen push route (`/report`)

| Sub-question: Where on Home? | Description | Selected |
|------------------------------|-------------|----------|
| Bottom of Home scroll | After meals + symptom + weight cards — non-intrusive | |
| Floating action button in AppBar | Always visible in header, small | |
| You decide | Claude decides | ✓ |

**User's choice:** Claude decides (delegated)
**Notes:** Claude to place at bottom of scroll with a ghost/outline Btn style, below weight card, non-competing with daily "Log meal" CTA.

---

## Time window UX

| Option | Description | Selected |
|--------|-------------|----------|
| Segmented control at top | 30d · 60d · 90d toggle — all data refreshes on switch | ✓ |
| Three expandable sections | All windows shown simultaneously as collapsible cards | |
| Dropdown / picker | Action sheet picker — extra tap | |

**User's choice:** Segmented control at top

| Sub-question: Default window | Description | Selected |
|------------------------------|-------------|----------|
| 30 days | Most recent and actionable for a doctor visit | ✓ |
| 90 days | Longer trend across cycle phases | |
| You decide | Claude decides | |

**User's choice:** 30 days default
**Notes:** Selected window is local state, not persisted — resets to 30d on re-open.

---

## GL + symptom timeline chart

| Option | Description | Selected |
|--------|-------------|----------|
| Single ComposedChart: GL line + symptom dots | One Recharts ComposedChart — Line for daily GL, Scatter for composite symptom score | ✓ |
| Two stacked charts | GL on top, symptoms below — separate y-axes, aligned x-axis | |
| GL only with colored bands | GL line + background bands for symptom severity | |

**User's choice:** Single ComposedChart

| Sub-question: Symptom score | Description | Selected |
|-----------------------------|-------------|----------|
| Composite score (avg of all symptoms) | One dot per day = avg of all tracked symptoms | ✓ |
| Individual symptom lines | Separate colored lines per symptom — busy | |
| Worst symptom per day | Lowest score recorded that day | |

**User's choice:** Composite score (avg of all symptoms)

| Sub-question: Red-flag display | Description | Selected |
|--------------------------------|-------------|----------|
| Highlighted region + callout card | Coral shading on chart + callout card below listing streaks | ✓ |
| Red dot markers on GL line | Streak points rendered as coral/red dots | |
| Separate Red Flags card (no chart highlighting) | Text-only streak list, no chart annotation | |

**User's choice:** Highlighted region + callout card below

---

## PDF export approach

| Option | Description | Selected |
|--------|-------------|----------|
| Browser print dialog (window.print) | Zero deps, browser native — works everywhere, limited layout control | |
| react-pdf/renderer | Declarative PDF via React — real PDF, text selectable, adds ~300KB bundle | ✓ |
| html2canvas + jsPDF screenshot | Screenshot-to-PDF — no layout duplication but image-only output | |

**User's choice:** react-pdf/renderer

| Sub-question: Charts in PDF | Description | Selected |
|-----------------------------|-------------|----------|
| Charts as static images + data tables | html2canvas for chart element → PNG embedded; rest as searchable tables | ✓ |
| Data tables only (no charts) | Simpler, no chart capture needed | |
| You decide | Claude decides | |

**User's choice:** Charts as static images + data tables
**Notes:** html2canvas captures only the chart DOM element; react-pdf embeds it as `<Image>`. Rest of PDF uses react-pdf text/table primitives (searchable).

---

## Claude's Discretion

- Exact CTA button wording on Home screen (e.g., "View Health Report", "Generate Doctor Report")
- Exact Report screen AppBar title
- Whether executive summary uses horizontal scroll cards or 2×2 grid (based on 390px phone width)
- Empty state messaging when insufficient data (< 7 days of logs)
- Color treatment for symptom dots: low vs high composite scores (coral vs mint)
- Exact CTA placement within Home screen scroll (bottom, ghost/outline style)

## Deferred Ideas

- AI-generated narrative interpretation of report data — v2 (new Edge Function, adds latency)
- Email delivery of PDF to user or doctor — v2 (requires email service)
- Scheduled/automated monthly report generation — v2 (requires background jobs)
- Coach read access to patient reports — v2 (coach portal out of scope)
- Per-symptom trend lines in chart (individual lines per symptom) — v2
- Cycle phase overlay on GL chart (colored bands per menstrual phase) — v2 consideration
- Side-by-side 30d vs 90d comparison on same screen — out of scope; segmented control is simpler
