# Bloom

## What This Is

Bloom is a PCOS-aware nutrition companion for women. Users log meals, track macros (protein, fiber, glycemic load), monitor symptoms, record weight, and follow their cycle — all in one place. A Claude-powered AI generates personalized daily targets and an Insulin Balance score based on the user's profile and cycle phase. Nutrition coaches can optionally be invited for read-only access to a user's data.

## Core Value

A woman with PCOS can understand how today's food choices affect her insulin balance and symptoms — and receive a personalized, actionable target for the day.

## Current Milestone: v1.1 Growth & Polish

**Goal:** Make Bloom shareable with real users — polished PWA presence, weekly AI insights on the dashboard, and a coach invite flow for read-only access.

**Target features:**
- Real PWA icons — create Bloom brand icon, generate all required sizes (72×72 → 512×512), replace 1×1px placeholders
- Weekly Insights card — Claude-generated weekly summary on the Home dashboard (food↔symptom correlations, cycle phase patterns, habit highlights)
- Coach invite flow — tokenized shareable link; coach opens in browser (no account required) and sees read-only view of food logs, macros, symptoms, and weight

## Requirements

### Validated

(None yet — ship to validate)

### Active (v1.1)

- [ ] App installs as a PWA with real Bloom brand icons (all standard sizes)
- [ ] User sees a weekly AI-generated insights card on the Home dashboard
- [ ] User can invite a coach via a shareable tokenized link (no coach account required)
- [ ] Coach can view user's food logs, macros, symptoms, and weight via the shared link (read-only, no login)

### Validated (v1.0 — shipped)

- [x] User can sign up, log in, and stay authenticated across sessions (AUTH)
- [x] User can complete onboarding (profile: age, height, weight, PCOS type, goals) (ONBD)
- [x] User can log period start date; app auto-calculates cycle day and phase (CYCL)
- [x] User can search USDA food database and log meals with macros (FOOD)
- [x] User can scan a product barcode to auto-fill food details (FOOD)
- [x] User can view today's dashboard (Insulin Balance score, PCOS macros vs. targets, meals, symptoms, weight) (DASH)
- [x] AI (Claude API) generates personalized macro targets and Insulin Balance score from user profile + cycle phase (AI)
- [x] User can log symptoms (energy, mood, sleep, bloating, skin) with 1–5 scale (SYMPT)
- [x] User can log daily weight (WGHT)
- [x] Cycle phase adjusts GL/macro targets dynamically; luteal craving interception shown (CYCL)
- [x] 30/60/90-day doctor-ready reports with GL/symptom chart and PDF export (RPT)
- [x] User can configure profile, theme (slate/warm/sage) (PROF)

### Out of Scope

- Full coach portal with client management dashboard — v1 coaches are read-only viewers, not active managers
- Native iOS / Android app — web PWA first; native is v2+
- Real-time messaging between user and coach — coach views data, communicates externally
- Apple Health / Oura / Withings integration — v2
- Subscription/payments system — v1 is free; monetization is v2
- Coach marketplace / finding coaches — v1 is invite-only
- Social features (sharing meals, community) — not core to PCOS value

## Context

- Full design handoff exists at `bloom-app-design/` — 11 screens: Welcome, Profile Setup, Coach Link, Today Dashboard, Food Diary, Symptoms, Food Search, Barcode Scan, Food Detail, Macros & GL, Weight Trend, Weekly Insights, Coach Protocol, Recipes, Profile
- Design system: CSS custom properties (`--b-*` tokens), 3 palettes (slate, warm, sage), dark mode, Manrope + Instrument Serif fonts
- Production app does not exist yet — entire app needs to be built from the design handoff
- Codebase map written 2026-05-18 in `.planning/codebase/` (STACK, ARCH, CONVENTIONS, CONCERNS, etc.)
- Food data: USDA FoodData Central API (free, no key required for basic use)
- AI: Claude API (claude-sonnet-4-6) for target generation and insights

## Constraints

- **Tech Stack**: Vite + React + TypeScript + react-router-dom + Supabase — confirmed during initialization
- **Platform**: Web PWA only for v1 — no native app
- **Data**: USDA FoodData Central for food search/barcode — free tier has rate limits (1000 req/hr)
- **AI Budget**: Claude API calls should be batched/cached — avoid per-keystroke calls; generate targets once per day or on profile change
- **Health Data**: Cycle and symptom data is sensitive PII — must use Supabase Row Level Security (RLS) on all user data tables
- **Design**: Pixel-perfect implementation of bloom-app-design handoff — do not deviate from visual design without explicit approval
- **Repository**: https://github.com/Milan-1002/Bloom.git

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web PWA over native app | Ship faster, validate core value first; camera API available in modern browsers for barcode scan | — Pending |
| USDA FoodData Central over paid APIs | Free, high-quality nutritional data (protein, fiber, GI); rate limits acceptable for v1 | — Pending |
| Claude API for targets + Insulin Balance | PCOS-specific macro targets require medical nuance; AI-generated is more personalized than static formulas | — Pending |
| Coaches are read-only viewers | Full coach portal is a separate product; keeps scope tight for v1 | — Pending |
| Supabase over custom backend | Auth + database + RLS in one; no server to manage; free tier sufficient for launch | — Pending |
| Carry forward --b-* design token system | Design handoff uses CSS custom properties consistently; easier to maintain theme system | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-26 — milestone v1.1 Growth & Polish started*
