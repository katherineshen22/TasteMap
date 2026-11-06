import { Dish, Recipe } from "@/types/food";
import { normalizeTag } from "@/lib/formatters";

const key = (value: string) => normalizeTag(value || "").toLowerCase();

export function recommendRecipes(
  dishes: Pick<Dish, "cuisine" | "rating" | "tags">[],
  recipes: Recipe[]
) {
  const likedDishes = dishes.filter((dish) => Number(dish.rating) >= 8);

  // Compare case-insensitively: saved tags are "Spicy", recipe tags "spicy".
  const favoriteCuisines = new Set(likedDishes.map((dish) => key(dish.cuisine)));
  const favoriteTags = new Set(
    likedDishes.flatMap((dish) => (dish.tags || []).map(key))
  );

  return recipes
    .map((recipe) => {
      let score = 0;

      if (favoriteCuisines.has(key(recipe.cuisine))) {
        score += 4;
      }

      const sharedTags = recipe.tags
        .filter((tag) => favoriteTags.has(key(tag)))
        .map(normalizeTag);
      score += sharedTags.length * 3;

      return {
        ...recipe,
        tags: recipe.tags.map(normalizeTag),
        score,
        reason: sharedTags.length
          ? `Matches your taste for ${sharedTags.join(", ")}`
          : "A popular pick to try",
      };
    })
    .sort((a, b) => b.score - a.score);
}
