import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Card } from '@/components/ui'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Topic {
  id: string
  icon: string
  title: string
  preview: string
  content: React.ReactNode
}

interface Section {
  label: string
  topics: Topic[]
}

// ── Accordion item ─────────────────────────────────────────────────────────────

function AccordionItem({
  topic,
  isOpen,
  onToggle,
}: {
  topic: Topic
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-b-hairline last:border-none">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-b-surface-sunken transition-colors"
      >
        <span className="text-xl shrink-0">{topic.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-b-ink">{topic.title}</p>
          {!isOpen && (
            <p className="mt-0.5 text-xs text-b-ink-3 truncate">{topic.preview}</p>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`shrink-0 text-b-ink-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-5 pt-0">
          <div className="prose-bloom">{topic.content}</div>
        </div>
      )}
    </div>
  )
}

// ── Prose helpers ──────────────────────────────────────────────────────────────

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-b-ink-2 leading-relaxed mb-3 last:mb-0">{children}</p>
}

function H({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-b-ink-3 uppercase tracking-widest mb-2 mt-4 first:mt-0">{children}</p>
}

function Callout({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'green' | 'amber' | 'neutral' }) {
  const colors = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    neutral: 'bg-b-surface-sunken border-b-hairline text-b-ink-2',
  }
  return (
    <div className={`rounded-b-md border px-3.5 py-3 text-sm leading-relaxed mb-3 ${colors[tone]}`}>
      {children}
    </div>
  )
}

function Bullet({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 mb-2 last:mb-0">
      <span className="text-base mt-0.5 shrink-0">{icon}</span>
      <p className="text-sm text-b-ink-2 leading-relaxed">{children}</p>
    </div>
  )
}

function GLRow({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-b-hairline last:border-none">
      <span className="text-base shrink-0">{value}</span>
      <div>
        <p className="text-sm font-semibold text-b-ink">{label}</p>
        <p className="text-xs text-b-ink-3">{desc}</p>
      </div>
    </div>
  )
}

// ── Content sections ───────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    label: 'About PCOS',
    topics: [
      {
        id: 'what-is-pcos',
        icon: '🧬',
        title: 'What is PCOS?',
        preview: 'A hormonal condition affecting 1 in 10 women',
        content: (
          <>
            <P>
              PCOS (Polycystic Ovary Syndrome) is a hormonal condition that affects how your
              ovaries work. Despite the name, not everyone with PCOS has cysts — the name comes
              from an older way of describing what doctors saw on ultrasounds.
            </P>
            <H>The main features</H>
            <Bullet icon="🔄">Irregular, infrequent, or absent periods</Bullet>
            <Bullet icon="⚗️">
              Higher-than-normal levels of androgens (male hormones like testosterone), which can
              cause acne, excess facial hair, and hair thinning
            </Bullet>
            <Bullet icon="🫧">
              Multiple small follicles (fluid-filled sacs) on the ovaries, visible on ultrasound
            </Bullet>
            <P style={{ marginTop: 12 }}>
              PCOS is very common — it affects around 1 in 10 women of reproductive age. It's a
              chronic condition, but symptoms can be greatly improved through lifestyle, especially
              what you eat.
            </P>
            <Callout tone="green">
              ✨ Bloom is built specifically for PCOS. Every metric and target is designed around
              what research shows helps most — not generic nutrition advice.
            </Callout>
          </>
        ),
      },
      {
        id: 'insulin-resistance',
        icon: '⚡',
        title: 'Insulin Resistance',
        preview: 'The hidden driver behind many PCOS symptoms',
        content: (
          <>
            <P>
              Insulin is a hormone made by your pancreas. Its job is to help your cells use glucose
              (sugar from food) as energy. Think of insulin as a key, and your cells as locks — when
              the key works properly, glucose gets inside the cell and is used for energy.
            </P>
            <P>
              With <strong>insulin resistance</strong>, your cells don't respond to insulin as well
              as they should. The key doesn't fit as smoothly. Your pancreas tries to compensate by
              producing more and more insulin.
            </P>
            <H>Why this worsens PCOS</H>
            <P>
              High insulin levels signal the ovaries to produce more androgens (testosterone). This
              disrupts the hormonal balance needed for ovulation, leading to irregular periods and
              many of the symptoms associated with PCOS.
            </P>
            <Callout tone="amber">
              ⚡ Around 70–80% of women with PCOS have some degree of insulin resistance — even
              those who are not overweight.
            </Callout>
            <H>The good news</H>
            <P>
              What you eat has a powerful, direct impact on insulin. Choosing lower-glycemic foods,
              eating enough protein and fiber, and avoiding large blood sugar spikes can all help
              reduce insulin resistance over time — and improve PCOS symptoms as a result.
            </P>
          </>
        ),
      },
      {
        id: 'nutrition-pcos',
        icon: '🥗',
        title: 'How Nutrition Helps',
        preview: 'Three simple principles that make a real difference',
        content: (
          <>
            <P>
              You don't need a perfect diet to improve PCOS. Research shows that even modest
              improvements in three areas can make a real difference:
            </P>
            <H>1 · Keep blood sugar steady</H>
            <P>
              Every time you eat carbohydrates, your blood sugar rises. The size and speed of that
              rise determines how much insulin your body needs to release. Choosing foods with a
              lower glycemic impact — and pairing carbs with protein and fiber — keeps that rise
              smaller and slower.
            </P>
            <H>2 · Eat enough protein</H>
            <P>
              Protein slows how fast carbohydrates enter your bloodstream. It also keeps you full
              for longer, which reduces cravings and the urge to reach for high-sugar foods between
              meals.
            </P>
            <H>3 · Include plenty of fiber</H>
            <P>
              Fiber is a type of carbohydrate your body can't fully digest. It slows the absorption
              of sugar and feeds the beneficial bacteria in your gut — a healthy gut is linked to
              better insulin sensitivity and lower inflammation.
            </P>
            <Callout tone="green">
              🌸 Bloom tracks all three of these — Glycemic Load, Protein, and Fiber — because
              they're the most evidence-backed levers for PCOS nutrition.
            </Callout>
          </>
        ),
      },
    ],
  },
  {
    label: 'Your Metrics Explained',
    topics: [
      {
        id: 'insulin-score',
        icon: '📊',
        title: 'Insulin Balance Score',
        preview: 'A 0–100 daily score of how well you supported stable insulin',
        content: (
          <>
            <P>
              Your <strong>Insulin Balance Score</strong> (shown as a number out of 100) is Bloom's
              daily summary of how well your food choices supported stable blood sugar and healthy
              insulin levels.
            </P>
            <H>What goes into the score</H>
            <Bullet icon="📉">
              <strong>Glycemic load</strong> of your meals — lower GL means a better score
            </Bullet>
            <Bullet icon="💪">
              <strong>Protein</strong> — whether you reached your protein target for the day
            </Bullet>
            <Bullet icon="🌿">
              <strong>Fiber</strong> — whether you reached your fiber target for the day
            </Bullet>
            <Bullet icon="🍽️">
              <strong>Meal balance</strong> — spreading food across meals is better than one large
              meal, which causes a bigger insulin spike
            </Bullet>
            <H>What the numbers mean</H>
            <GLRow label="Excellent" value="🟢" desc="80–100 · You had a great day for insulin balance" />
            <GLRow label="Good" value="🟡" desc="60–79 · Solid choices, minor room to improve" />
            <GLRow label="Needs work" value="🔴" desc="Under 60 · Look for lower-GL swaps tomorrow" />
            <P style={{ marginTop: 12 }}>
              The score is a guide, not a judgment. One low-scoring day doesn't derail progress —
              consistency over weeks is what matters.
            </P>
          </>
        ),
      },
      {
        id: 'gl',
        icon: '🌾',
        title: 'Glycemic Load (GL)',
        preview: 'How much a food actually raises your blood sugar',
        content: (
          <>
            <P>
              Glycemic Load measures the real-world blood sugar impact of what you eat. It takes
              into account two things: how quickly a food raises blood sugar <em>and</em> how much
              of that food you actually ate.
            </P>
            <H>The formula</H>
            <Callout>
              GL = (Glycemic Index × grams of carbs in your portion) ÷ 100
            </Callout>
            <P>
              <strong>Glycemic Index (GI)</strong> rates how fast a food raises blood sugar on a
              scale of 0–100. But GI alone can be misleading — watermelon has a high GI, but a
              typical serving has so few carbs that its GL is actually low.
            </P>
            <P>
              GL fixes this by factoring in serving size. A GL of 10 or less is considered low.
            </P>
            <H>What the numbers mean (per food)</H>
            <GLRow label="Low GL" value="✅" desc="≤10 · Gentle rise in blood sugar" />
            <GLRow label="Medium GL" value="⚠️" desc="11–19 · Moderate effect" />
            <GLRow label="High GL" value="🔴" desc="≥20 · Significant blood sugar spike" />
            <H>Your daily GL total</H>
            <P>
              Bloom tracks your total GL across all meals. For PCOS, a daily total under 100 is
              generally a good goal, though your personalized target may differ.
            </P>
            <H>Why you sometimes see "—"</H>
            <P>
              When a food's Glycemic Index isn't available in our database, we show "—" instead
              of a number. We never show 0 for unknown GL — that would wrongly suggest the food
              has zero blood sugar impact.
            </P>
          </>
        ),
      },
      {
        id: 'protein',
        icon: '💪',
        title: 'Protein',
        preview: 'Slows glucose, keeps you full, supports hormones',
        content: (
          <>
            <P>
              Protein is the most powerful macronutrient for PCOS management. Here's why it matters
              so much:
            </P>
            <Bullet icon="🩸">
              <strong>Slows blood sugar rise</strong> — eating protein alongside carbs reduces how
              quickly glucose enters your bloodstream, lowering the insulin response
            </Bullet>
            <Bullet icon="😌">
              <strong>Keeps you full</strong> — protein is the most satiating macronutrient, which
              reduces cravings and the urge to snack on high-GL foods
            </Bullet>
            <Bullet icon="🏋️">
              <strong>Builds muscle</strong> — muscle tissue improves insulin sensitivity; more
              muscle means your body handles glucose better
            </Bullet>
            <Bullet icon="⚗️">
              <strong>Supports hormone production</strong> — many hormones are made from amino
              acids (the building blocks of protein)
            </Bullet>
            <H>How much do you need?</H>
            <P>
              Your protein target is personalized by Bloom's AI based on your weight and goals.
              A general guideline for PCOS is around 1.2–1.6g per kg of body weight per day —
              higher than standard recommendations because of PCOS-specific insulin considerations.
            </P>
            <Callout tone="green">
              💡 Tip: Try to include a source of protein in every meal — not just one big portion
              at dinner. Spreading protein through the day works better for blood sugar.
            </Callout>
          </>
        ),
      },
      {
        id: 'fiber',
        icon: '🌿',
        title: 'Fiber',
        preview: 'Slows sugar absorption and feeds your gut bacteria',
        content: (
          <>
            <P>
              Fiber is a type of carbohydrate that your body can't fully digest. Rather than being
              absorbed for energy, it passes through your digestive system — and in doing so, it
              does a lot of good work.
            </P>
            <H>Why fiber matters for PCOS</H>
            <Bullet icon="🩸">
              <strong>Slows glucose absorption</strong> — soluble fiber (from oats, beans, apples)
              forms a gel in your gut that slows how fast sugar enters your bloodstream
            </Bullet>
            <Bullet icon="🦠">
              <strong>Feeds good gut bacteria</strong> — a healthy microbiome is linked to better
              insulin sensitivity and lower inflammation
            </Bullet>
            <Bullet icon="😌">
              <strong>Keeps you full</strong> — fiber adds bulk to meals without extra calories
            </Bullet>
            <Bullet icon="🔥">
              <strong>Reduces inflammation</strong> — chronic low-grade inflammation worsens PCOS;
              high-fiber diets are consistently linked to lower inflammatory markers
            </Bullet>
            <H>How much?</H>
            <P>
              Aim for 25–30g of fiber per day. Most people eat far less than this. Even getting
              from 10g to 20g is a meaningful improvement you'll feel over time.
            </P>
            <Callout tone="green">
              🌱 Best sources: lentils, chickpeas, black beans, oats, chia seeds, avocado,
              broccoli, berries, and whole grain bread.
            </Callout>
          </>
        ),
      },
      {
        id: 'calories',
        icon: '🍽️',
        title: 'Calories',
        preview: 'Energy in food — tracked as adequacy, not deficit',
        content: (
          <>
            <P>
              Calories are a measure of the energy your food provides. Your body uses energy for
              everything — breathing, moving, thinking, regulating hormones.
            </P>
            <H>How Bloom treats calories</H>
            <P>
              Bloom shows your calorie intake and a personalized daily target, but we frame this as{' '}
              <strong>adequacy</strong>, not deficit. This means:
            </P>
            <Bullet icon="✅">Reaching your target means you fueled your body well</Bullet>
            <Bullet icon="⚠️">
              Consistently eating far below target can trigger stress hormones (cortisol) that
              actually worsen PCOS symptoms and disrupt your cycle
            </Bullet>
            <Bullet icon="❌">We never show a "red" state for eating under target</Bullet>
            <P>
              The goal here is <strong>nourishment, not restriction</strong>. Severe calorie
              restriction is associated with worsening PCOS in research studies.
            </P>
            <Callout tone="amber">
              ⚠️ Many PCOS apps and diets focus on eating as little as possible. Bloom doesn't
              — because for PCOS, under-eating creates hormonal stress that can make things worse.
            </Callout>
          </>
        ),
      },
      {
        id: 'carbs-fat',
        icon: '🥑',
        title: 'Carbs & Fat',
        preview: 'Context for the other two macros',
        content: (
          <>
            <H>Carbohydrates</H>
            <P>
              Carbs are your body's main energy source. For PCOS, the <em>type</em> of carb matters
              much more than the total amount. Whole, unprocessed carbs (vegetables, legumes, whole
              grains, fruit) come packaged with fiber, vitamins, and minerals, and they raise blood
              sugar more slowly.
            </P>
            <P>
              Refined carbs (white bread, white rice, pastries, sugary drinks) are stripped of
              fiber, so they raise blood sugar quickly — and trigger a larger insulin response.
            </P>
            <H>Fat</H>
            <P>
              Healthy fats from whole foods are an important part of a PCOS diet. They:
            </P>
            <Bullet icon="🫀">Support hormone production (hormones are made from fat)</Bullet>
            <Bullet icon="🔥">Reduce inflammation (especially omega-3 fats from fish, walnuts, flaxseed)</Bullet>
            <Bullet icon="🩸">Slow digestion, which helps prevent blood sugar spikes after meals</Bullet>
            <P>
              Saturated fat (from red meat and full-fat dairy) is fine in moderation. Ultra-processed
              trans fats (in many packaged snacks) are best minimised.
            </P>
            <Callout tone="green">
              💡 For PCOS, protein and GL are the most impactful metrics to focus on first.
              Carbs and fat give you the full picture, but they're supporting actors.
            </Callout>
          </>
        ),
      },
    ],
  },
  {
    label: 'Your Cycle',
    topics: [
      {
        id: 'why-cycle',
        icon: '🌙',
        title: 'Why Your Cycle Matters',
        preview: 'Hormones shift every week — so do your nutritional needs',
        content: (
          <>
            <P>
              Your menstrual cycle isn't just about your period. It's a 28-ish day hormonal journey
              that affects your energy, mood, appetite, sleep, and how your body handles food —
              including insulin sensitivity.
            </P>
            <P>
              Two hormones drive the cycle: <strong>estrogen</strong> and{' '}
              <strong>progesterone</strong>. Their levels rise and fall in a pattern — and each
              phase of that pattern creates a different internal environment.
            </P>
            <Callout tone="amber">
              ⚠️ PCOS often disrupts the natural cycle, making phases irregular or unpredictable.
              But understanding where you <em>might</em> be in your cycle still helps explain many
              symptoms you experience.
            </Callout>
            <P>
              When you enter your last period date in Bloom, we use it to estimate your current
              cycle phase and adjust your daily targets to match your likely hormonal environment.
            </P>
          </>
        ),
      },
      {
        id: 'menstrual-phase',
        icon: '🔴',
        title: 'Menstrual Phase',
        preview: 'Days 1–5 · Your period · Rest and replenish',
        content: (
          <>
            <P>
              Day 1 is the first day of your period. Estrogen and progesterone are both at their
              lowest. The uterine lining sheds.
            </P>
            <H>How you might feel</H>
            <P>
              Fatigue, cramps, lower energy, and a desire to rest are all normal. Many women also
              experience increased appetite or food cravings during this phase.
            </P>
            <H>Nutrition focus</H>
            <Bullet icon="🥩">Iron-rich foods to replace what's lost (red meat, lentils, spinach, tofu)</Bullet>
            <Bullet icon="🐟">Omega-3 fats to reduce prostaglandins (which cause cramps) — salmon, sardines, flaxseed</Bullet>
            <Bullet icon="🍫">Magnesium for cramp relief — dark chocolate, pumpkin seeds, leafy greens</Bullet>
            <Callout tone="neutral">
              💙 Bloom's targets during this phase are slightly lower in intensity. Rest and
              nourishment are the priority — not optimization.
            </Callout>
          </>
        ),
      },
      {
        id: 'follicular-phase',
        icon: '🌱',
        title: 'Follicular Phase',
        preview: 'Days 6–13 · Rising energy · Best insulin sensitivity',
        content: (
          <>
            <P>
              After your period ends, estrogen begins to rise. The follicles in your ovaries
              develop, each containing a maturing egg. One will eventually be released at ovulation.
            </P>
            <H>How you might feel</H>
            <P>
              Energy increases, mood often improves, and you may feel more motivated and social.
              This is typically the easiest phase for exercise and new habits.
            </P>
            <H>Nutrition focus</H>
            <P>
              Insulin sensitivity is at its peak during the follicular phase — your body handles
              carbohydrates most efficiently right now. Targets may be slightly higher in energy
              to match your increased activity capacity.
            </P>
            <Bullet icon="🥦">Focus on variety and whole foods — your body absorbs nutrients well</Bullet>
            <Bullet icon="💪">Great time to support muscle building with adequate protein</Bullet>
            <Callout tone="green">
              🌱 If you're going to try a new healthy food or eating pattern, the follicular phase
              is a great time to start — energy and willpower tend to be higher.
            </Callout>
          </>
        ),
      },
      {
        id: 'ovulatory-phase',
        icon: '🌟',
        title: 'Ovulatory Phase',
        preview: 'Around Day 14 · Peak energy for a brief window',
        content: (
          <>
            <P>
              Estrogen reaches its peak, triggering a surge of LH (luteinizing hormone) that
              causes the most mature follicle to release an egg. This is ovulation. The window is
              typically just 12–48 hours, though the lead-up spans a few days.
            </P>
            <H>How you might feel</H>
            <P>
              Many women feel their most energetic and social around ovulation. Libido often
              increases. Body temperature rises slightly (this is used in fertility tracking).
            </P>
            <H>Nutrition focus</H>
            <P>
              Continue the same balanced approach as the follicular phase. Antioxidant-rich foods
              (berries, leafy greens, bell peppers) support egg health and reduce oxidative stress
              — which can be elevated in PCOS.
            </P>
            <Callout tone="neutral">
              ℹ️ With PCOS, ovulation may not occur every cycle, or it may happen later than
              expected. The ovulatory phase may be shorter or absent in some cycles.
            </Callout>
          </>
        ),
      },
      {
        id: 'luteal-phase',
        icon: '🌒',
        title: 'Luteal Phase',
        preview: 'Days 15–28 · Progesterone rises · Insulin sensitivity drops',
        content: (
          <>
            <P>
              After ovulation, the empty follicle transforms into the corpus luteum, which
              produces progesterone. If no pregnancy occurs, the corpus luteum breaks down,
              progesterone drops, and your period begins — starting the cycle again.
            </P>
            <H>How you might feel</H>
            <P>
              This is the phase many women with PCOS find hardest. Common experiences include:
              increased appetite, carb cravings, fatigue, bloating, mood changes, and breast
              tenderness. This is normal — not a failure of willpower.
            </P>
            <H>Why insulin matters more now</H>
            <P>
              Progesterone reduces insulin sensitivity. This means your body needs more insulin
              to handle the same amount of carbohydrate than in earlier phases. The same meal
              can have a bigger blood sugar impact during the luteal phase.
            </P>
            <H>Nutrition focus</H>
            <Bullet icon="📉">Lower GL targets — be more mindful of blood sugar impact</Bullet>
            <Bullet icon="🥜">More magnesium (pumpkin seeds, almonds, dark chocolate) for mood and cramps</Bullet>
            <Bullet icon="🍌">Complex carbs rather than refined ones to satisfy cravings more sustainably</Bullet>
            <Bullet icon="😌">Don't restrict — respond to hunger with nourishing food</Bullet>
            <Callout tone="amber">
              ⚠️ Cravings during the luteal phase are hormonal, not a lack of discipline. Bloom
              adjusts your targets to account for this — you're not expected to eat the same way
              as earlier in your cycle.
            </Callout>
          </>
        ),
      },
    ],
  },
  {
    label: 'How Bloom Works',
    topics: [
      {
        id: 'how-targets',
        icon: '🎯',
        title: 'How Your Targets Are Set',
        preview: 'AI personalization based on your profile, goals, and cycle',
        content: (
          <>
            <P>
              Every day, Bloom generates personalized targets for protein, fiber, calories, and
              glycemic load. These are not fixed numbers — they're calculated by Bloom's AI
              based on what it knows about you.
            </P>
            <H>What goes in</H>
            <Bullet icon="👤">Your age, height, and current weight</Bullet>
            <Bullet icon="🎯">Your stated goals (e.g. regulate periods, lose weight, improve energy)</Bullet>
            <Bullet icon="🧬">Your PCOS type (insulin-resistant, adrenal, inflammatory, etc.)</Bullet>
            <Bullet icon="🌙">Your current cycle phase (if you've entered your cycle info)</Bullet>
            <H>When targets update</H>
            <P>
              Targets are <strong>not</strong> recalculated every time you open the app. They're
              cached for the day so they stay stable — constant changes would be confusing and
              counterproductive. Targets refresh when you update your profile information.
            </P>
            <Callout tone="green">
              💡 To get the most accurate targets, keep your profile up to date — especially
              your weight and cycle information.
            </Callout>
          </>
        ),
      },
      {
        id: 'weight-average',
        icon: '📈',
        title: '7-Day Weight Average',
        preview: 'Why Bloom smooths your weight chart',
        content: (
          <>
            <P>
              Bloom's weight chart shows a 7-day rolling average rather than your raw daily
              weight. This means the line you see represents the average of the past 7 days at
              any given point — not just what the scale said that morning.
            </P>
            <H>Why this matters for PCOS</H>
            <P>
              Daily weight can swing by 1–3 kg due to:
            </P>
            <Bullet icon="💧">Water retention (especially around your period)</Bullet>
            <Bullet icon="🍽️">How much food is currently in your digestive system</Bullet>
            <Bullet icon="⚗️">Hormonal fluctuations that affect fluid balance</Bullet>
            <Bullet icon="🧂">Salt intake from the day before</Bullet>
            <P>
              Focusing on raw daily numbers is psychologically harmful and not meaningful. One
              "high" morning reading can ruin your mood even when you're genuinely making progress.
            </P>
            <H>What to look for instead</H>
            <P>
              A flat or gently declining rolling average over several weeks is meaningful progress
              — even if individual days jump around. The trend over 4–8 weeks is what matters, not
              any single data point.
            </P>
            <Callout tone="green">
              🧘 Log your weight consistently (ideally same time of day, same conditions), then
              ignore the individual readings and focus on the line trend over time.
            </Callout>
          </>
        ),
      },
      {
        id: 'symptom-tracking',
        icon: '💆',
        title: 'Symptom Tracking',
        preview: 'Understanding the connection between food and how you feel',
        content: (
          <>
            <P>
              Bloom lets you log five daily symptoms: energy, mood, sleep quality, bloating, and
              skin. These are the symptoms most commonly reported by women with PCOS, and the ones
              most directly affected by nutrition.
            </P>
            <H>Why track symptoms?</H>
            <P>
              Over time, symptom tracking reveals patterns. You might notice that high-GL days
              correlate with lower energy the next day, or that good protein days improve your
              mood. This is data <em>about your body</em> that no general nutrition guide can
              give you.
            </P>
            <H>How to use the data</H>
            <P>
              Bloom's report screen overlays your GL score against your symptom scores over time.
              Look for weeks where symptoms consistently improved — what were you eating differently?
            </P>
            <Callout tone="neutral">
              📊 Symptoms are rated 1–5. Higher is better for energy, mood, and sleep. Lower is
              better for bloating and skin issues. Consistency in logging matters more than any
              single day's entry.
            </Callout>
          </>
        ),
      },
      {
        id: 'pcos-types',
        icon: '🔬',
        title: 'PCOS Types',
        preview: 'Not all PCOS is the same — your type shapes your targets',
        content: (
          <>
            <P>
              PCOS isn't a single condition — it's a syndrome with several underlying drivers.
              Understanding your type can help you focus on the most effective interventions.
            </P>
            <H>Insulin-resistant PCOS</H>
            <P>
              The most common type (70–80% of cases). High insulin drives high androgens. Diet and
              lifestyle have the largest impact here. Low-GL eating, regular movement, and adequate
              sleep can significantly improve symptoms.
            </P>
            <H>Adrenal PCOS</H>
            <P>
              Driven by stress hormones (DHEA-S) rather than insulin. Stress management,
              adequate sleep, and avoiding over-exercise are especially important alongside diet.
            </P>
            <H>Inflammatory PCOS</H>
            <P>
              Driven by chronic low-grade inflammation, which stimulates androgen production.
              Anti-inflammatory foods (fatty fish, turmeric, leafy greens, berries) play a
              bigger role here.
            </P>
            <H>Post-pill PCOS</H>
            <P>
              Can occur after stopping hormonal contraception as the body re-establishes its
              own hormonal rhythm. Often temporary. Usually resolves within 3–6 months, though
              it can persist if underlying PCOS was always present.
            </P>
            <Callout tone="neutral">
              ℹ️ Bloom asks about your PCOS type during onboarding and uses it to adjust your
              targets and tips. If you're unsure of your type, "managing symptoms" is a safe
              starting point.
            </Callout>
          </>
        ),
      },
    ],
  },
]

// ── Back icon ─────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function HelpScreen() {
  const navigate = useNavigate()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col bg-b-bg pb-10">
      <AppBar
        title="Learn"
        leading={
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-b-ink-2 active:bg-b-surface-sunken transition-colors"
            aria-label="Go back"
          >
            <BackIcon />
          </button>
        }
      />

      {/* Hero */}
      <div className="mx-5 mt-3 mb-5 rounded-b-md bg-b-primary px-5 py-5 shadow-b-card">
        <p className="text-xl font-bold text-b-primary-ink">Understanding Bloom 🌸</p>
        <p className="mt-1.5 text-sm text-b-primary-ink opacity-80 leading-relaxed">
          Plain-English explanations of PCOS, your metrics, your cycle, and how Bloom
          calculates everything — written for every level of health literacy.
        </p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5 px-5">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-b-ink-3">
              {section.label}
            </p>
            <Card className="p-0 overflow-hidden">
              {section.topics.map((topic) => (
                <AccordionItem
                  key={topic.id}
                  topic={topic}
                  isOpen={openIds.has(topic.id)}
                  onToggle={() => toggle(topic.id)}
                />
              ))}
            </Card>
          </div>
        ))}

        <p className="text-center text-[11px] text-b-ink-4 mt-2">
          Bloom uses evidence-based nutrition research for PCOS. This is not medical advice —
          always work with your healthcare provider.
        </p>
      </div>
    </div>
  )
}
