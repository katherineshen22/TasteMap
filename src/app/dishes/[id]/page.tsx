"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DeleteDishButton from "@/components/DeleteDishButton";
import InternetRecipeSearch from "@/components/InternetRecipeSearch";
import { recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";

export default function DishDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDish() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
      }

      setDish((data || null) as Dish | null);
      setLoading(false);
    }

    loadDish();
  }, [id, router]);

  const matchingRecipes = dish
    ? recommendRecipes([dish], recipes).slice(0, 3)
    : [];

  return (
    <main className="min-h-screen bg-[#faf7ef] p-8">
      <Navbar />

      {loading && <p className="text-gray-700">Loading dish...</p>}

      {error && (
        <p className="mb-4 text-red-600">
          Error loading dish: {error}
        </p>
      )}

      {!loading && !dish ? (
        <p className="text-gray-700">
          Dish not found. It may have been deleted, or you may not be logged into
          the account that created it.
        </p>
      ) : null}

      {dish && (
        <>
          <section className="mb-8 max-w-3xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm text-gray-500">{dish.restaurant}</p>

            <h1 className="mb-2 text-4xl font-black text-black">
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

            <Link
              href={`/dishes/${dish.id}/edit`}
              className="mt-4 mr-3 inline-block rounded-full border border-black px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white"
            >
              Edit Dish
            </Link>

            <DeleteDishButton dishId={dish.id} />
          </section>

          <section className="max-w-3xl">
            <h2 className="mb-4 text-2xl font-black text-black">
              Cook something like this
            </h2>

            <div className="grid gap-4">
              {matchingRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                >
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

            <div className="mt-8">
              <h2 className="mb-4 text-2xl font-black text-black">
                Search internet recipes like this dish
              </h2>

              <InternetRecipeSearch
                defaultQuery={dish.dish}
                defaultCuisine={dish.cuisine}
                defaultTags={dish.tags?.slice(0, 2).join(", ") || ""}
                dishForAI={{
                  restaurant: dish.restaurant,
                  dish: dish.dish,
                  cuisine: dish.cuisine,
                  tags: dish.tags || [],
                  notes: dish.notes || "",
                }}
              />
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