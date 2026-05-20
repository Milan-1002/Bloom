/**
 * cycleContent.ts — Static per-phase educational copy and Luteal tip card data.
 *
 * All strings are hardcoded English (not AI-generated) for consistency and reliability.
 * chipLabel contains '{N}' as a runtime substitution placeholder for cycleDay.
 */

import type { CyclePhase } from './cycle'

// ── Per-phase educational content ─────────────────────────────────────────

export const PHASE_CONTENT: Record<
  CyclePhase,
  { title: string; chipLabel: string; explanation: string }
> = {
  menstrual: {
    title: 'Menstrual',
    chipLabel: 'Menstrual · Day {N}',
    explanation:
      'During your period, prostaglandins can lower your energy and increase inflammation. Lean protein and iron-rich foods (lentils, spinach, lean beef) help replenish what you lose. Keeping glycemic load moderate prevents the blood-sugar dips that worsen cramps and fatigue. Rest is productive — your body is doing real work.',
  },
  follicular: {
    title: 'Follicular',
    chipLabel: 'Follicular · Day {N}',
    explanation:
      'Oestrogen is rising and your insulin sensitivity is improving. This is your most metabolically flexible phase — slightly higher carb choices and complex whole grains are well-tolerated. Protein still matters for follicle development. Many women feel their sharpest and most energetic right now; lean into it.',
  },
  ovulation: {
    title: 'Ovulation',
    chipLabel: 'Ovulation · Day {N}',
    explanation:
      'Oestrogen peaks and luteinising hormone surges this week. Your energy is high and inflammation is low, making this a great time for higher-intensity activity. Macro targets stay near your personal baseline. Antioxidant-rich foods (berries, dark leafy greens) support the oxidative demands of ovulation.',
  },
  luteal: {
    title: 'Luteal',
    chipLabel: 'Luteal · Day {N}',
    explanation:
      'Progesterone is dominant and naturally lowers insulin sensitivity — even without dietary changes your body processes glucose less efficiently. A tighter GL ceiling and a higher protein floor help stabilise blood sugar and reduce the cravings driven by progesterone-triggered serotonin dips. Magnesium-rich foods (pumpkin seeds, dark chocolate ≥70%) can ease PMS symptoms.',
  },
}

// ── Luteal phase comfort food swaps ───────────────────────────────────────

export const LUTEAL_SWAPS = [
  { craving: 'Chocolate', swap: 'Dark cacao rice cakes',          glNote: 'GL ~8'  },
  { craving: 'Pasta',     swap: 'Lentil pasta with olive oil',    glNote: 'GL ~26' },
  { craving: 'Crisps',    swap: 'Roasted chickpeas',              glNote: 'GL ~10' },
] as const
