-- ── library_recipes ────────────────────────────────────────────────────────────
-- Shared, pre-seeded PCOS-friendly recipe library visible to all authenticated users.
-- No user_id — these are curated by Bloom, not per-user.
create table public.library_recipes (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null,
  time_min     integer not null,
  kcal         integer not null,
  protein_g    integer not null,
  fiber_g      integer not null,
  carbs_g      integer not null,
  gl           integer not null,
  tags         text[] not null default '{}',
  ingredients  text[] not null default '{}',
  instructions text[] not null default '{}',
  created_at   timestamptz default now()
);

alter table public.library_recipes enable row level security;

create policy "library_recipes_select_authenticated"
  on public.library_recipes for select
  to authenticated using (true);

-- ── saved_recipes ────────────────────────────────────────────────────────────
-- Per-user saved/favourited recipes. Stores full recipe JSON so custom AI-
-- generated recipes (not in library_recipes) can also be saved.
create table public.saved_recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  recipe_id   text not null,           -- recipe.id from client (e.g. "lib-<uuid>" or "custom-<ts>")
  recipe      jsonb not null,          -- full Recipe JSON snapshot
  source      text not null default 'library'
                check (source in ('library','generated_profile','generated_fridge')),
  saved_at    timestamptz default now(),
  unique (user_id, recipe_id)
);

alter table public.saved_recipes enable row level security;

create policy "saved_recipes_own"
  on public.saved_recipes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── seed: 20 PCOS-friendly library recipes ───────────────────────────────────

insert into public.library_recipes
  (name, category, time_min, kcal, protein_g, fiber_g, carbs_g, gl, tags, ingredients, instructions)
values

-- 1. Turmeric Salmon Power Bowl
(
  'Turmeric Salmon Power Bowl',
  'salmon', 25, 520, 38, 8, 42, 9,
  ARRAY['low-gl','high-protein','anti-inflam'],
  ARRAY[
    '180g salmon fillet',
    '1 cup cooked quinoa',
    '2 cups baby spinach',
    '1/2 cup roasted sweet potato cubes',
    '1/4 avocado, sliced',
    '1 tbsp olive oil',
    '1 tsp ground turmeric',
    '1 tbsp lemon juice',
    'Salt and pepper to taste'
  ],
  ARRAY[
    'Season salmon with turmeric, salt, pepper and lemon juice; let sit 5 minutes.',
    'Heat olive oil in a skillet over medium-high heat. Cook salmon 3–4 minutes per side until cooked through.',
    'Arrange quinoa in a bowl and top with baby spinach and roasted sweet potato.',
    'Flake salmon over the bowl and fan the avocado slices alongside.',
    'Drizzle any pan juices over the bowl and serve immediately.'
  ]
),

-- 2. Chickpea Shakshuka
(
  'Chickpea & Spinach Shakshuka',
  'eggs', 30, 380, 22, 12, 45, 10,
  ARRAY['low-gl','high-fiber','high-protein','anti-inflam'],
  ARRAY[
    '1 can (400g) diced tomatoes',
    '1 can (400g) chickpeas, drained',
    '2 large eggs',
    '2 cups baby spinach',
    '1 small onion, diced',
    '2 cloves garlic, minced',
    '1 tsp ground cumin',
    '1 tsp smoked paprika',
    '1/2 tsp ground turmeric',
    '1 tbsp olive oil, fresh parsley to garnish'
  ],
  ARRAY[
    'Heat olive oil in a deep skillet over medium heat. Sauté onion for 4 minutes until soft, then add garlic and cook 1 minute more.',
    'Add cumin, paprika and turmeric; stir 30 seconds until fragrant.',
    'Pour in tomatoes and chickpeas; season with salt and pepper. Simmer 10 minutes until sauce thickens.',
    'Stir in spinach until wilted, then create 2 wells in the sauce and crack an egg into each.',
    'Cover and cook 5–6 minutes until whites are set but yolks are still runny. Garnish with parsley and serve.'
  ]
),

-- 3. Quinoa Berry Protein Bowl
(
  'Quinoa Berry Protein Bowl',
  'bowl', 10, 340, 14, 9, 52, 12,
  ARRAY['high-fiber','quick','anti-inflam'],
  ARRAY[
    '1 cup cooked quinoa, cooled',
    '1/2 cup blueberries',
    '1/4 cup raspberries',
    '2 tbsp almond butter',
    '1 tbsp chia seeds',
    '1/4 cup unsweetened almond milk',
    '1 tsp honey',
    '1/4 tsp cinnamon'
  ],
  ARRAY[
    'Spoon quinoa into a bowl and stir in chia seeds and almond milk.',
    'Warm almond butter slightly and drizzle over quinoa.',
    'Top with blueberries and raspberries.',
    'Drizzle honey and dust with cinnamon. Serve immediately or refrigerate overnight.'
  ]
),

-- 4. Lemon Herb Baked Salmon
(
  'Lemon Herb Baked Salmon',
  'salmon', 20, 430, 42, 3, 8, 3,
  ARRAY['low-gl','high-protein','anti-inflam','quick'],
  ARRAY[
    '2 salmon fillets (160g each)',
    '1 bunch asparagus, trimmed',
    '2 cloves garlic, minced',
    '2 tbsp fresh dill, chopped',
    '1 lemon, zested and sliced',
    '2 tbsp olive oil',
    'Salt and pepper to taste'
  ],
  ARRAY[
    'Preheat oven to 200 °C (400 °F). Line a baking tray with foil.',
    'Toss asparagus with 1 tbsp olive oil, salt and pepper; spread on one half of the tray.',
    'Place salmon on the other half. Mix remaining olive oil, garlic, dill and lemon zest; spread over salmon.',
    'Layer lemon slices on top of salmon and bake 12–15 minutes until salmon flakes easily.',
    'Serve salmon alongside asparagus with any pan juices spooned over.'
  ]
),

-- 5. Greek Lentil & Spinach Soup
(
  'Greek Lentil & Spinach Soup',
  'soup', 35, 360, 20, 14, 55, 10,
  ARRAY['low-gl','high-fiber','high-protein','anti-inflam'],
  ARRAY[
    '1 cup red lentils, rinsed',
    '3 cups baby spinach',
    '1 can (400g) diced tomatoes',
    '1 litre vegetable stock',
    '1 onion, diced',
    '3 cloves garlic, minced',
    '1 tsp ground cumin',
    '1/2 tsp ground turmeric',
    '2 tbsp olive oil',
    'Juice of 1 lemon, salt and pepper'
  ],
  ARRAY[
    'Heat olive oil in a large pot over medium heat. Sauté onion 5 minutes; add garlic and cook 1 more minute.',
    'Add cumin and turmeric; stir 30 seconds, then add lentils, tomatoes and stock.',
    'Bring to a boil, reduce heat and simmer 20 minutes until lentils are soft.',
    'Stir in spinach and cook 2 minutes until wilted. Season with lemon juice, salt and pepper.',
    'Serve as is or blend half the soup for a creamier texture.'
  ]
),

-- 6. Smashed Avocado Egg Toast
(
  'Smashed Avocado & Poached Egg Toast',
  'toast', 15, 390, 18, 8, 35, 12,
  ARRAY['high-fiber','quick'],
  ARRAY[
    '2 slices whole-grain sourdough bread',
    '1 ripe avocado',
    '2 eggs',
    '1 tbsp apple cider vinegar',
    '1/2 lemon, juiced',
    'Pinch of chilli flakes',
    'Salt, pepper and everything-bagel seasoning'
  ],
  ARRAY[
    'Bring a small pot of water to a gentle simmer and add vinegar.',
    'Toast sourdough slices until golden.',
    'Mash avocado with lemon juice, salt and pepper; spread thickly on toast.',
    'Crack each egg into a small cup, create a swirl in the simmering water and slide eggs in. Poach 3 minutes for runny yolks.',
    'Place a poached egg on each slice; sprinkle with chilli flakes and everything-bagel seasoning. Serve immediately.'
  ]
),

-- 7. Ginger Turmeric Chicken Stir-Fry
(
  'Ginger Turmeric Chicken Stir-Fry',
  'stir_fry', 25, 440, 38, 5, 30, 8,
  ARRAY['low-gl','high-protein','anti-inflam','quick'],
  ARRAY[
    '300g chicken breast, thinly sliced',
    '2 cups broccoli florets',
    '1 cup snap peas',
    '1 red bell pepper, sliced',
    '2 cloves garlic, minced',
    '1 tbsp fresh ginger, grated',
    '1 tsp ground turmeric',
    '2 tbsp tamari or low-sodium soy sauce',
    '1 tbsp sesame oil',
    '1 tsp honey, sesame seeds to garnish'
  ],
  ARRAY[
    'Mix tamari, honey, turmeric and 2 tbsp water in a small bowl; set aside.',
    'Heat sesame oil in a wok or large skillet over high heat. Add chicken and cook 5–6 minutes until golden; remove.',
    'In the same pan, stir-fry garlic and ginger 30 seconds, then add broccoli and snap peas for 3 minutes.',
    'Add bell pepper and return chicken to the pan. Pour sauce over and toss everything together for 2 minutes.',
    'Scatter sesame seeds on top and serve over cauliflower rice or plain.'
  ]
),

-- 8. Black Bean & Sweet Potato Bowl
(
  'Black Bean & Sweet Potato Bowl',
  'bowl', 20, 410, 16, 14, 68, 11,
  ARRAY['low-gl','high-fiber','anti-inflam','quick'],
  ARRAY[
    '1 medium sweet potato, cubed',
    '1 can (400g) black beans, drained and rinsed',
    '1 cup frozen corn, thawed',
    '1 avocado, diced',
    '1/4 red onion, finely diced',
    '1 lime, juiced',
    '1 tbsp olive oil',
    '1 tsp smoked paprika',
    '1/2 tsp ground cumin',
    'Fresh coriander, salt and pepper'
  ],
  ARRAY[
    'Toss sweet potato cubes with olive oil, paprika, cumin, salt and pepper. Microwave 5 minutes or roast 15 minutes at 200 °C.',
    'Warm black beans in a small saucepan with a splash of water and a pinch of cumin; season to taste.',
    'Assemble bowl: sweet potato, black beans and corn side by side.',
    'Top with diced avocado and red onion; squeeze lime juice over everything.',
    'Garnish generously with fresh coriander and serve.'
  ]
),

-- 9. Mediterranean Tuna Salad
(
  'Mediterranean Tuna Salad',
  'salad', 10, 310, 32, 5, 18, 5,
  ARRAY['low-gl','high-protein','anti-inflam','quick'],
  ARRAY[
    '2 cans (160g each) tuna in olive oil, drained',
    '1 cup cherry tomatoes, halved',
    '1/2 cucumber, diced',
    '1/4 cup Kalamata olives, halved',
    '1/4 red onion, thinly sliced',
    '2 tbsp capers',
    '2 tbsp extra-virgin olive oil',
    '1 tbsp red wine vinegar',
    'Fresh parsley, salt and pepper'
  ],
  ARRAY[
    'Combine tuna, tomatoes, cucumber, olives, red onion and capers in a large bowl.',
    'Whisk olive oil and red wine vinegar together with a pinch of salt and pepper.',
    'Pour dressing over salad and toss gently to coat.',
    'Taste and adjust seasoning; garnish with fresh parsley and serve immediately or refrigerate up to 4 hours.'
  ]
),

-- 10. Cauliflower Fried Rice
(
  'Cauliflower Egg Fried Rice',
  'bowl', 20, 280, 14, 8, 28, 6,
  ARRAY['low-gl','high-fiber','quick'],
  ARRAY[
    '1 small cauliflower head, grated or pulsed to "rice"',
    '1 cup frozen edamame, thawed',
    '1/2 cup frozen peas',
    '2 eggs, lightly beaten',
    '2 cloves garlic, minced',
    '1 tbsp fresh ginger, grated',
    '2 tbsp tamari or low-sodium soy sauce',
    '1 tbsp sesame oil',
    '2 spring onions, sliced'
  ],
  ARRAY[
    'Heat half the sesame oil in a large wok or skillet over high heat. Add garlic and ginger; stir 30 seconds.',
    'Add cauliflower rice and stir-fry 4–5 minutes until slightly golden and tender.',
    'Push cauliflower to one side, add remaining oil, and scramble eggs in the space until just set.',
    'Add edamame and peas; toss everything together. Pour tamari over and stir-fry 2 more minutes.',
    'Scatter spring onions on top and serve hot.'
  ]
),

-- 11. Greek Yogurt Berry Power Bowl
(
  'Greek Yogurt Berry Power Bowl',
  'bowl', 5, 360, 28, 4, 38, 9,
  ARRAY['low-gl','high-protein','anti-inflam','quick'],
  ARRAY[
    '250g full-fat Greek yogurt',
    '1/2 cup mixed berries (blueberries, raspberries)',
    '2 tbsp walnuts, roughly chopped',
    '1 tbsp flaxseed meal',
    '1 tsp raw honey',
    '1/4 tsp cinnamon',
    'Pinch of vanilla extract'
  ],
  ARRAY[
    'Spoon Greek yogurt into a bowl and stir in vanilla extract and cinnamon.',
    'Pile berries on top of yogurt.',
    'Scatter walnuts and flaxseed over the berries.',
    'Drizzle honey over everything and serve immediately.'
  ]
),

-- 12. Mediterranean Veggie Frittata
(
  'Mediterranean Veggie Frittata',
  'eggs', 35, 380, 26, 5, 18, 7,
  ARRAY['low-gl','high-protein','anti-inflam'],
  ARRAY[
    '6 large eggs',
    '1 zucchini, thinly sliced',
    '1 red bell pepper, diced',
    '1/2 cup cherry tomatoes, halved',
    '60g feta cheese, crumbled',
    '1 handful fresh basil leaves',
    '2 cloves garlic, minced',
    '2 tbsp olive oil',
    'Salt and pepper to taste'
  ],
  ARRAY[
    'Preheat oven to 190 °C (375 °F). Beat eggs with a good pinch of salt and pepper in a jug.',
    'Heat olive oil in an oven-safe skillet over medium heat. Sauté garlic and bell pepper 3 minutes, then add zucchini and cook 2 more minutes.',
    'Scatter tomatoes into the pan, then pour beaten eggs over the vegetables.',
    'Crumble feta on top and cook on the stovetop 3 minutes until edges start to set.',
    'Transfer skillet to oven and bake 12–15 minutes until frittata is puffed and golden. Scatter fresh basil and serve warm or at room temperature.'
  ]
),

-- 13. Miso Ginger Salmon Stir-Fry
(
  'Miso Ginger Salmon Stir-Fry',
  'stir_fry', 20, 480, 36, 6, 28, 8,
  ARRAY['low-gl','high-protein','anti-inflam','quick'],
  ARRAY[
    '320g salmon, skin removed and cubed',
    '2 bok choy heads, quartered',
    '1 cup shiitake mushrooms, sliced',
    '2 tbsp white miso paste',
    '1 tbsp fresh ginger, grated',
    '2 cloves garlic, minced',
    '1 tbsp rice vinegar',
    '1 tbsp sesame oil',
    '1 tsp honey',
    'Spring onions and sesame seeds to serve'
  ],
  ARRAY[
    'Whisk miso, ginger, rice vinegar, honey and 3 tbsp warm water into a smooth sauce; set aside.',
    'Heat sesame oil in a wok over high heat. Sear salmon cubes 2 minutes per side until golden; remove.',
    'In the same wok, stir-fry garlic, mushrooms and bok choy 3–4 minutes until tender.',
    'Return salmon to wok, pour miso sauce over and toss gently for 1 minute until everything is coated.',
    'Top with spring onions and sesame seeds; serve immediately over cauliflower rice or buckwheat noodles.'
  ]
),

-- 14. Warming Red Lentil Dal
(
  'Warming Red Lentil Dal',
  'legumes', 30, 320, 18, 12, 50, 10,
  ARRAY['low-gl','high-fiber','high-protein','anti-inflam'],
  ARRAY[
    '1 cup red lentils, rinsed',
    '1 can (400ml) light coconut milk',
    '1 can (400g) diced tomatoes',
    '1 onion, diced',
    '3 cloves garlic, minced',
    '1 tbsp fresh ginger, grated',
    '1 tsp ground turmeric',
    '1 tsp ground cumin',
    '1 tsp garam masala',
    '1 tbsp coconut oil, fresh coriander and lime to serve'
  ],
  ARRAY[
    'Heat coconut oil over medium heat. Sauté onion 5 minutes, then add garlic, ginger and all spices; cook 1 minute stirring constantly.',
    'Add lentils, tomatoes and coconut milk; stir well and bring to a boil.',
    'Reduce heat, cover partially and simmer 18–20 minutes until lentils are completely soft.',
    'Season generously with salt and adjust spices to taste.',
    'Serve in bowls topped with fresh coriander and a squeeze of lime.'
  ]
),

-- 15. Zucchini Noodle Pesto Chicken
(
  'Zucchini Noodle Pesto Chicken',
  'pasta_alt', 25, 420, 35, 4, 16, 5,
  ARRAY['low-gl','high-protein','quick'],
  ARRAY[
    '300g chicken breast, sliced',
    '3 medium zucchini, spiralised',
    '3 tbsp basil pesto',
    '1 cup cherry tomatoes, halved',
    '2 cloves garlic, minced',
    '2 tbsp olive oil',
    '30g pine nuts, toasted',
    '30g Parmesan, grated',
    'Salt and pepper to taste'
  ],
  ARRAY[
    'Season chicken with salt and pepper. Heat 1 tbsp olive oil in a large skillet over medium-high heat; cook chicken 5–6 minutes until cooked through. Set aside.',
    'In the same skillet, heat remaining oil and sauté garlic 30 seconds. Add cherry tomatoes and cook 2 minutes until they start to blister.',
    'Add zucchini noodles and toss 1–2 minutes — just enough to warm through without going soggy.',
    'Remove from heat, add pesto and sliced chicken; toss everything together.',
    'Plate up and top with pine nuts and Parmesan. Serve immediately.'
  ]
),

-- 16. Berry Chia Overnight Oats
(
  'Berry Chia Overnight Oats',
  'bowl', 10, 380, 14, 12, 52, 9,
  ARRAY['low-gl','high-fiber','anti-inflam','quick'],
  ARRAY[
    '1/2 cup rolled oats',
    '2 tbsp chia seeds',
    '1 cup unsweetened almond milk',
    '1/4 cup blueberries',
    '1/4 cup strawberries, sliced',
    '2 tbsp almond butter',
    '1 tsp honey',
    '1/2 tsp cinnamon',
    'Pinch of vanilla extract'
  ],
  ARRAY[
    'Combine oats, chia seeds, almond milk, cinnamon and vanilla in a jar or bowl; stir well.',
    'Cover and refrigerate overnight (or at least 4 hours) until thick and creamy.',
    'In the morning, stir oats and add a splash more milk if too thick.',
    'Top with blueberries and strawberries, drizzle almond butter and honey over everything.',
    'Serve cold straight from the fridge.'
  ]
),

-- 17. Thai Peanut Chicken Lettuce Wraps
(
  'Thai Peanut Chicken Lettuce Wraps',
  'chicken', 20, 390, 32, 4, 22, 7,
  ARRAY['low-gl','high-protein','quick'],
  ARRAY[
    '400g chicken mince',
    '8 large butter lettuce leaves',
    '2 tbsp natural peanut butter',
    '1 tbsp tamari',
    '1 tbsp lime juice',
    '1 tsp honey',
    '1 tbsp sesame oil',
    '1/2 cup shredded carrot',
    '1/4 cup cucumber, julienned',
    'Fresh mint and coriander, chilli flakes to taste'
  ],
  ARRAY[
    'Whisk peanut butter, tamari, lime juice, honey and 2 tbsp warm water into a smooth sauce.',
    'Heat sesame oil in a skillet over high heat. Cook chicken mince, breaking it up, for 6–7 minutes until cooked through.',
    'Pour half the peanut sauce over chicken; toss and cook 1 more minute.',
    'Arrange lettuce leaves on a plate. Spoon chicken mixture into each leaf.',
    'Top with carrot, cucumber, fresh herbs and chilli flakes. Serve with remaining sauce on the side.'
  ]
),

-- 18. White Bean & Tomato Soup
(
  'White Bean & Roasted Tomato Soup',
  'soup', 25, 300, 16, 11, 48, 9,
  ARRAY['low-gl','high-fiber','anti-inflam','quick'],
  ARRAY[
    '2 cans (400g each) white cannellini beans, drained',
    '1 can (400g) diced tomatoes',
    '2 cups baby spinach',
    '1 litre vegetable stock',
    '4 cloves garlic, minced',
    '1 onion, diced',
    '2 tbsp olive oil',
    '1 tsp dried oregano',
    '1/2 tsp smoked paprika',
    'Juice of 1/2 lemon, salt and pepper'
  ],
  ARRAY[
    'Heat olive oil in a large pot over medium heat. Sauté onion 4 minutes until soft, then add garlic and cook 1 minute.',
    'Add oregano and paprika; stir 30 seconds, then add tomatoes, beans and stock.',
    'Simmer 12 minutes. Use a potato masher to roughly crush some beans for a creamy texture.',
    'Stir in spinach and cook 2 minutes until wilted. Season with lemon juice, salt and pepper.',
    'Serve with a drizzle of olive oil and crusty whole-grain bread if desired.'
  ]
),

-- 19. Sardine & Avocado Toast
(
  'Sardine & Avocado Toast',
  'toast', 8, 370, 26, 7, 30, 8,
  ARRAY['low-gl','high-protein','anti-inflam','quick'],
  ARRAY[
    '2 cans (120g each) sardines in olive oil, drained',
    '1 ripe avocado',
    '2 slices whole-grain rye bread',
    '1 lemon, juiced and zested',
    '1/2 tsp chilli flakes',
    '1/4 red onion, very thinly sliced',
    '1 tbsp capers',
    'Fresh dill, salt and pepper'
  ],
  ARRAY[
    'Toast rye bread slices until golden and crisp.',
    'Mash avocado with half the lemon juice and a pinch of salt; spread generously on toast.',
    'Flake sardines over the avocado, leaving some texture.',
    'Scatter red onion, capers and lemon zest over the top.',
    'Finish with chilli flakes, fresh dill, pepper and remaining lemon juice. Serve immediately.'
  ]
),

-- 20. Cinnamon Apple Buckwheat Porridge
(
  'Cinnamon Apple Buckwheat Porridge',
  'bowl', 15, 320, 10, 9, 60, 10,
  ARRAY['low-gl','high-fiber','anti-inflam'],
  ARRAY[
    '1/2 cup raw buckwheat groats, soaked overnight and rinsed',
    '1 medium apple, cored and grated',
    '1 cup unsweetened oat milk',
    '2 tbsp walnuts, roughly chopped',
    '1 tbsp chia seeds',
    '1 tsp cinnamon',
    '1/4 tsp ground ginger',
    '1 tsp maple syrup or honey'
  ],
  ARRAY[
    'Combine rinsed buckwheat and oat milk in a saucepan over medium heat.',
    'Bring to a simmer, then add grated apple, cinnamon and ginger; stir well.',
    'Cook 8–10 minutes, stirring often, until groats are soft and porridge is creamy. Add more milk for looser consistency.',
    'Stir in chia seeds and cook 1 more minute.',
    'Serve in a bowl topped with walnuts and a drizzle of maple syrup or honey.'
  ]
);
