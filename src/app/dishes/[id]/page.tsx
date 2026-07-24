import Navbar from "@/components/Navbar";
import { recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";
import Link from "next/link";
import DeleteDishButton from "@/components/DeleteDishButton";
import InternetRecipeSearch from "@/components/InternetRecipeSearch";

type DishDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DishDetailsPage({ params }: DishDetailsPageProps) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .eq("id", id)
    .single();

  const dish = data as Dish | null;

  const matchingRecipes = dish
    ? recommendRecipes([dish], recipes).slice(0, 3)
    : [];

  return (
    <main className="min-h-screen bg-yellow-50 p-8">
      <Navbar />

      {error && (
        <p className="mb-4 text-red-600">
          Error loading dish: {error.message}
        </p>
      )}

      {!dish ? (
        <p className="text-gray-700">Dish not found.</p>
      ) : (
        <>
          <section className="mb-8 max-w-3xl rounded-xl bg-white p-6 shadow">
            <p className="mb-2 text-sm text-gray-500">{dish.restaurant}</p>

            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              {dish.dish}
            </h1>

            <p className="mb-2 text-gray-700">{dish.cuisine}</p>

            <p className="mb-4 text-xl font-semibold text-gray-900">
              {dish.rating}/10
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {dish.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#faf7ef] px-3 py-1 text-sm text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-gray-700">{dish.notes}</p>
            
            <Link href={`/dishes/${dish.id}/edit`} className="mt-4 mr-3 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-gray-900 border border-gray-300"
            >
                Edit Dish
            </Link>

            <DeleteDishButton dishId={dish.id} />
          </section>

          <section className="max-w-3xl">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              Cook something like this
            </h2>

            <div className="mt-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    Search internet recipes like this dish
                </h2>

                <InternetRecipeSearch
                    defaultQuery={dish.dish}
                    defaultCuisine={dish.cuisine}
                    defaultTags={dish.tags?.slice(0, 2).join(", ") || ""}
                />
            </div>

            <div className="grid gap-4">
              {matchingRecipes.map((recipe) => (
                <div key={recipe.id} className="rounded-xl bg-white p-4 shadow">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {recipe.title}
                  </h3>

                  <p className="text-gray-600">
                    {recipe.cuisine} · {recipe.timeMinutes} min ·{" "}
                    {recipe.difficulty}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">{recipe.reason}</p>

                  <p className="mt-2 text-sm text-gray-600">
                    Ingredients: {recipe.ingredients.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Link
            href="/rankings"
            className="mt-8 inline-block text-gray-700 underline"
          >
            ← Back to rankings
          </Link>
        </>
      )}
    </main>
  );
}