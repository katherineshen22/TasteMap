import Link from "next/link";
import Navbar from "@/components/Navbar";
import { dishes, recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";

export default function Home() {
  const topDishes = [...dishes].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const recommendedRecipes = recommendRecipes(dishes, recipes).slice(0, 3);

  return (
    <main className="min-h-screen bg-orange-50 p-8">
      <h1 className="text-4xl font-bold mb-2 text-gray-900">TasteMap</h1>

      <p className="text-gray-700 mb-8">
        Track your favorite restaurant dishes and find recipes you would actually want to cook.
      </p>

      <Link 
        href="/add"
        className="inline-block bg-black text-white rounded-lg px-4 py-2 font-semibold mb-8">
        Add Your First Dish
      </Link>

      <Link
        href="/rankings"
        className="inline-block bg-white text-gray-900 rounded-lg px-4 py-2 font-semibold border border-gray-300 ml-3">
        View Rankings
      </Link>

      <Link
        href="/recipes"
        className="inline-block bg-white text-gray-900 rounded-lg px-4 py-2 font-semibold border border-gray-300 ml-3">
      View Recipes
      </Link>


      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Top Dishes</h2>

        <div className="grid gap-4 max-w-3xl">
          {topDishes.map((dish) => (
            <div key={dish.id} className="bg-white rounded-xl p-4 shadow">
              <h3 className="text-xl font-semibold text-gray-900">{dish.dish}</h3>
              <p className="text-gray-600 ">{dish.restaurant}</p>
              <p className="font-medium text-gray-900">Rating: {dish.rating}/10</p>
              <p className="text-sm text-gray-500">{dish.tags.join(", ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Recommended Recipes</h2>

        <div className="grid gap-4 max-w-3xl">
          {recommendedRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-xl p-4 shadow">
              <h3 className="text-xl font-semibold text-gray-900">{recipe.title}</h3>
              <p className="text-gray-600">
                {recipe.cuisine} · {recipe.timeMinutes} min · {recipe.difficulty}
              </p>
              <p className="text-sm text-gray-500">{recipe.reason}</p>
              <p className="text-sm mt-2 text-gray-900">
                Match score: <span className="font-semibold text-gray-900">{recipe.score}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}