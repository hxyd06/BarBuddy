// Define mood-based keywords to match drink types
const moodKeywords: Record<string, string[]> = {
  party: ['tequila', 'rum', 'vodka', 'mojito', 'spritz', 'punch'],
  date_night: ['martini', 'old fashioned', 'negroni', 'red wine'],
  chill: ['cream', 'coffee', 'amaretto', 'kahlua', 'coconut'],
  summer: ['lime', 'pineapple', 'lemon', 'frozen'],
  winter: ['brandy', 'bourbon', 'spiced', 'mulled', 'cream', 'coffee', 'chocolate', 'hot'],
  brunch: ['mimosa', 'bellini', 'juice'],
};

// Extracts mood tags for a given drink based on its name and ingredients
export function getMoodTags(drink: any): string[] {
  const name = drink.name?.toLowerCase() || drink.strDrink?.toLowerCase() || '';
  const ingredients: string[] = [];

  // Collect up to 15 ingredients from drink object
  for (let i = 1; i <= 15; i++) {
    const ing = drink[`strIngredient${i}`];
    if (ing) ingredients.push(ing.toLowerCase());
  }

  // Combine name and ingredients into one string for keyword matching
  const combined = `${name} ${ingredients.join(' ')}`;
  const tags: string[] = [];

  // Check for matching mood keywords
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      tags.push(mood);
    }
  }

  // Return matched tags or default to 'general'
  return tags.length ? tags : ['general'];
}
