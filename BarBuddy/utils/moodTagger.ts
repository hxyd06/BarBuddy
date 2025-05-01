const moodKeywords: Record<string, string[]> = {
    party: ['tequila', 'rum', 'vodka', 'mojito', 'spritz', 'punch'],
    date_night: ['martini', 'old fashioned', 'negroni', 'red wine'],
    chill: ['cream', 'coffee', 'amaretto', 'kahlua', 'coconut'],
    summer: ['lime', 'pineapple', 'lemon', 'frozen'],
    winter: ['brandy', 'bourbon', 'spiced', 'mulled', 'cream', 'coffee', 'chocolate', 'hot'],
    brunch: ['mimosa', 'bellini', 'juice'],
  };
  
  export function getMoodTags(drink: any): string[] {
    const name = drink.name?.toLowerCase() || drink.strDrink?.toLowerCase() || '';
    const ingredients: string[] = [];
  
    for (let i = 1; i <= 15; i++) {
      const ing = drink[`strIngredient${i}`];
      if (ing) ingredients.push(ing.toLowerCase());
    }
  
    const combined = `${name} ${ingredients.join(' ')}`;
    const tags: string[] = [];
  
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => combined.includes(keyword))) {
        tags.push(mood);
      }
    }
  
    return tags.length ? tags : ['general'];
  }