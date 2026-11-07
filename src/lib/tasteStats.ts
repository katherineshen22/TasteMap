import { Dish } from "@/types/food";

function mostCommon(values: string[]) {
  const counts: Record<string, number> = {};
  values.forEach((value) => {
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export function getTasteStats(dishes: Dish[]) {
  const averageRating =
    dishes.length > 0
      ? dishes.reduce((sum, dish) => sum + Number(dish.rating), 0) /
        dishes.length
      : null;

  return {
    totalDishes: dishes.length,
    averageRating,
    favoriteCuisine: mostCommon(
      dishes.map((dish) => dish.cuisine).filter(Boolean)
    ),
    topTag: mostCommon(dishes.flatMap((dish) => dish.tags || [])),
    citiesExplored: new Set(
      dishes.map((dish) => dish.city?.trim().toLowerCase()).filter(Boolean)
    ).size,
  };
}
