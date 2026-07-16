import Link from "next/link";
import Navbar from "@/components/Navbar";
import { dishes, recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";

export default function RecipesPage() {
  const recommendedRecipes = recommendRecipes(dishes, recipes);

  return (
    <main className="min-h-screen bg-yellow-50 p-8">
        <Navbar />
      <h1 className="text-4xl font-bold mb-2 text-gray-900">
        Recommended Recipes
      </h1>

      <p className="text-gray-700 mb-4">
        Recipes matched to the restaurant dishes you rated highly.
      </p>

      <Link href="/" className="inline-block mb-6 text-gray-700 underline">
        ← Back to Home
      </Link>

      <div className="grid gap-4 max-w-3xl">
        {recommendedRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-xl p-4 shadow">
            <h2 className="text-xl font-semibold text-gray-900">
              {recipe.title}
            </h2>

            <p className="text-gray-600">
              {recipe.cuisine} · {recipe.timeMinutes} min · {recipe.difficulty}
            </p>

            <p className="text-sm text-gray-500 mt-1">{recipe.reason}</p>

            <p className="text-sm mt-2 text-gray-800">
              Match score:{" "}
              <span className="font-semibold">{recipe.score}</span>
            </p>

            <p className="text-sm mt-2 text-gray-600">
              Tags: {recipe.tags.join(", ")}
            </p>

            <p className="text-sm mt-1 text-gray-600">
              Ingredients: {recipe.ingredients.join(", ")}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}