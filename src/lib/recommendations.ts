type Dish = {
    cuisine: string;
    rating: number;
    tags: string[];
  };
  
  type Recipe = {
    id: number;
    title: string;
    cuisine: string;
    timeMinutes: number;
    difficulty: string;
    tags: string[];
    ingredients: string[];
  };
  
  export function recommendRecipes(dishes: Dish[], recipes: Recipe[]) {
    const likedDishes = dishes.filter((dish) => dish.rating >= 8);
  
    const favoriteCuisines = likedDishes.map((dish) => dish.cuisine);
    const favoriteTags = likedDishes.flatMap((dish) => dish.tags);
  
    return recipes
      .map((recipe) => {
        let score = 0;
  
        if (favoriteCuisines.includes(recipe.cuisine)) {
          score += 4;
        }
  
        const sharedTags = recipe.tags.filter((tag) => favoriteTags.includes(tag));
        score += sharedTags.length * 3;
  
        return {
          ...recipe,
          score,
          reason: sharedTags.length
            ? `Matches your taste for ${sharedTags.join(", ")}`
            : "Recommended based on your food profile",
        };
      })
      .sort((a, b) => b.score - a.score);
  }