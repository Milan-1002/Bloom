# Discussion Log — Phase 1: Foundation

**Date:** 2026-05-18
**Areas discussed:** Styling approach, Email verification flow
**Areas deferred to Claude:** Onboarding gate behavior, Theme persistence

---

## Area 1: Styling Approach

**Q1: How should production components be styled?**
Options: CSS Modules / Tailwind CSS / Keep inline styles
**Selected:** Tailwind CSS

**Q2: How should Tailwind reference the --b-* design tokens?**
Options: CSS var bridge / Tailwind-native themes / You decide
**Selected:** You decide (Claude's discretion → CSS var bridge chosen)

**Q3: How should component customization work with Tailwind?**
Options: className prop only / Both className and style / No override — variants only
**Selected:** className prop only

---

## Area 2: Email Verification Flow

**Q1: What happens before email verification?**
Options: Hard block / Soft gate / Verify on first action
**Selected:** Hard block — must verify first

**Q2: What can the "Check your inbox" screen do?**
Options: Resend + change email / Resend only / Resend + support link
**Selected:** Resend email + change email address

**Q3: Where does the user land after clicking the verification link?**
Options: Onboarding step 1 (straight in) / "Email verified!" confirmation / Login with success toast
**Selected:** Onboarding step 1 — straight in

---

## Claude's Discretion Items

- **Tailwind/token bridge strategy** — CSS variable bridge (`colors: { 'b-primary': 'var(--b-primary)' }`) preserves data-attribute theme switching without JS injection.
- **Onboarding gate** — Hard gate with localStorage progress tracking (step index). RequireProfile guard redirects to current incomplete step.
- **Theme persistence** — localStorage only for v1. Fast, no Supabase round-trip.
- **Onboarding steps** — Coach-link step from prototype skipped in Phase 1 (coach is v2). Phase 1 onboarding: welcome → profile form → PCOS type + goals → complete.

---

## Deferred Ideas

None surfaced during discussion.
