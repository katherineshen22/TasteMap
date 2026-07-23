import Navbar from "@/components/Navbar";
import { recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";
import Link from "next/link";

export default async function Home() {
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .order("rating", { ascending: false });

  const dishes = (data || []) as Dish[];

  const topDishes = dishes.slice(0, 3);
  const recommendedRecipes = recommendRecipes(dishes, recipes).slice(0, 3);

  const averageRating =
    dishes.length > 0
      ? dishes.reduce((sum, dish) => sum + Number(dish.rating), 0) /
        dishes.length
      : 0;

  const cuisineCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  dishes.forEach((dish) => {
    if (dish.cuisine) {
      cuisineCounts[dish.cuisine] = (cuisineCounts[dish.cuisine] || 0) + 1;
    }

    dish.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const favoriteCuisine =
    Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "None yet";

  const topTag =
    Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "None yet";

  return (
    <main className="min-h-screen bg-yellow-50 p-8">
      <Navbar />

      <section className="mb-10 max-w-4xl">
        <h1 className="mb-2 text-5xl font-bold text-gray-900">TasteMap</h1>

        <p className="mb-6 text-lg text-gray-700">
          Track your favorite restaurant dishes and find recipes you would
          actually want to cook.
        </p>

        <Link
          href="/add"
          className="inline-block rounded-lg bg-black px-4 py-2 font-semibold text-white"
        >
          Add Your First Dish
        </Link>
      </section>

      {error && (
        <p className="mb-4 text-red-600">
          Error loading dishes: {error.message}
        </p>
      )}

      <section className="mb-10 grid max-w-4xl gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Dishes</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {dishes.length}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Average Rating</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {dishes.length > 0 ? averageRating.toFixed(1) : "—"}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Favorite Cuisine</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {favoriteCuisine}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Top Flavor Tag</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{topTag}</p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          Top Dishes
        </h2>

        {topDishes.length === 0 ? (
          <p className="text-gray-700">
            No dishes saved yet. Add your first dish to start ranking.
          </p>
        ) : (
          <div className="grid max-w-3xl gap-4">
            {topDishes.map((dish) => (
              <Link
                key={dish.id}
                href={`/dishes/${dish.id}`}
                className="block rounded-xl bg-white p-4 shadow transition hover:shadow-md"
              >
                <h3 className="text-xl font-semibold text-gray-900">
                  {dish.dish}
                </h3>
                <p className="text-gray-600">{dish.restaurant}</p>
                <p className="font-medium text-gray-800">
                  Rating: {dish.rating}/10
                </p>
                <p className="text-sm text-gray-500">
                  {dish.tags?.join(", ")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          Recommended Recipes
        </h2>

        {dishes.length === 0 ? (
          <p className="text-gray-700">
            Add dishes first so TasteMap can recommend recipes.
          </p>
        ) : (
          <div className="grid max-w-3xl gap-4">
            {recommendedRecipes.map((recipe) => (
              <div key={recipe.id} className="rounded-xl bg-white p-4 shadow">
                <h3 className="text-xl font-semibold text-gray-900">
                  {recipe.title}
                </h3>
                <p className="text-gray-600">
                  {recipe.cuisine} · {recipe.timeMinutes} min ·{" "}
                  {recipe.difficulty}
                </p>
                <p className="text-sm text-gray-500">{recipe.reason}</p>
                <p className="mt-2 text-sm text-gray-800">
                  Match score:{" "}
                  <span className="font-semibold">{recipe.score}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}