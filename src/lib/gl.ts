// Glycemic Index lookup table — common foods, values from peer-reviewed public literature.
// GI is measured relative to glucose (GI=100). Sources: Atkinson et al. (2008) Am J Clin Nutr.
// GL = (GI × available_carbs_g) / 100
// When GI is unknown, return null — UI renders "—" per CLAUDE.md rule 4.

const GI_TABLE: [string[], number][] = [
  // Breads & grains
  [['white bread', 'wonder bread', 'white loaf'], 75],
  [['whole wheat bread', 'wholemeal bread', 'whole grain bread'], 69],
  [['sourdough', 'sourdough bread'], 54],
  [['rye bread', 'pumpernickel'], 58],
  [['bagel'], 72],
  [['pita bread', 'pita'], 57],
  [['tortilla', 'flour tortilla'], 30],
  // Rice
  [['white rice', 'jasmine rice', 'long grain white rice'], 73],
  [['brown rice', 'long grain brown rice'], 68],
  [['basmati rice'], 57],
  [['sushi rice'], 72],
  [['wild rice'], 57],
  // Pasta
  [['spaghetti', 'pasta white', 'white pasta', 'macaroni'], 49],
  [['whole wheat pasta', 'whole grain pasta', 'wholewheat pasta'], 42],
  [['gnocchi'], 68],
  // Cereals & oats
  [['rolled oats', 'oatmeal', 'porridge'], 55],
  [['instant oatmeal', 'quick oats'], 79],
  [['cornflakes', 'corn flakes'], 81],
  [['bran flakes'], 74],
  [['muesli'], 57],
  [['granola'], 62],
  // Other grains
  [['quinoa'], 53],
  [['barley', 'pearl barley'], 28],
  [['couscous'], 65],
  [['bulgur', 'bulgur wheat'], 47],
  [['polenta', 'cornmeal'], 68],
  // Potatoes
  [['baked potato', 'russet potato', 'potato baked'], 85],
  [['boiled potato', 'potato boiled'], 82],
  [['mashed potato', 'mashed potatoes'], 83],
  [['sweet potato', 'yam'], 63],
  [['french fries', 'fries'], 63],
  [['potato chips', 'crisps'], 51],
  // Legumes
  [['lentils', 'red lentils', 'green lentils', 'brown lentils'], 32],
  [['chickpeas', 'garbanzo beans', 'hummus'], 28],
  [['black beans'], 30],
  [['kidney beans', 'red kidney beans'], 24],
  [['soybeans', 'edamame'], 15],
  [['pinto beans'], 39],
  [['navy beans', 'white beans'], 31],
  [['split peas'], 25],
  // Fruits
  [['apple', 'apple juice'], 36],
  [['banana'], 51],
  [['orange', 'orange juice'], 43],
  [['mango'], 51],
  [['grapes', 'grape juice'], 53],
  [['watermelon'], 76],
  [['strawberries', 'strawberry'], 41],
  [['blueberries', 'blueberry'], 53],
  [['pineapple'], 59],
  [['peach', 'peaches'], 42],
  [['pear', 'pears'], 38],
  [['cherries', 'cherry'], 22],
  [['dates', 'medjool dates'], 42],
  [['dried apricots', 'apricots dried'], 32],
  [['raisins'], 64],
  [['kiwi', 'kiwifruit'], 53],
  // Dairy
  [['whole milk', 'full fat milk'], 39],
  [['skim milk', 'skimmed milk', 'nonfat milk'], 37],
  [['yogurt', 'plain yogurt', 'greek yogurt'], 36],
  [['ice cream'], 57],
  [['custard'], 43],
  // Vegetables (most non-starchy veg have negligible carbs / GI<20)
  [['carrots', 'cooked carrots'], 35],
  [['corn', 'sweet corn'], 52],
  [['peas', 'green peas'], 51],
  [['parsnip'], 52],
  [['beetroot', 'beet'], 64],
  // Snacks & sweets
  [['popcorn'], 65],
  [['rice cakes', 'rice cake'], 82],
  [['crackers', 'water crackers'], 67],
  [['pretzels'], 83],
  [['corn chips', 'doritos'], 42],
  [['chocolate', 'dark chocolate', 'milk chocolate'], 40],
  // Sweeteners
  [['honey'], 61],
  [['sucrose', 'table sugar'], 65],
  [['fructose', 'fruit sugar'], 15],
  [['glucose'], 100],
  [['maple syrup'], 54],
  [['agave nectar', 'agave syrup'], 19],
  // Beverages
  [['cola', 'soda', 'soft drink', 'coca-cola', 'pepsi'], 63],
  [['sports drink', 'gatorade', 'powerade'], 74],
]

function lookupGI(description: string): number | null {
  const lower = description.toLowerCase()
  for (const [keys, gi] of GI_TABLE) {
    if (keys.some((k) => lower.includes(k))) return gi
  }
  return null
}

/**
 * Calculate glycemic load from food description + carb content per serving.
 * Returns null when GI is unknown — UI must render "—" not "0".
 */
export function calculateGL(description: string, carbs_g: number): number | null {
  const gi = lookupGI(description)
  if (gi === null || carbs_g <= 0) return null
  return Math.round((gi * carbs_g) / 100 * 10) / 10
}

/** Format GL for display. Returns "—" when GL is unknown (rule 4). */
export function formatGL(gl: number | null): string {
  return gl === null ? '—' : String(gl)
}

/** Look up GI for display (e.g., on food detail screen). */
export function lookupGIForDisplay(description: string): number | null {
  return lookupGI(description)
}
