"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";
import Link from "next/link";

export default function Home() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDishes() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .order("rating", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setDishes((data || []) as Dish[]);
      }

      setLoading(false);
    }

    loadDishes();
  }, []);

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
    <main className="min-h-screen bg-[#faf7ef] p-8">
      <Navbar />

      <section className="mx-auto mb-16 max-w-5xl text-center">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-gray-600">
          Your personal food memory map
        </p>

        <h1 className="mb-6 text-6xl font-black tracking-tight text-black md:text-7xl">
          TasteMap
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-gray-700">
          Track your favorite restaurant dishes, learn your taste patterns, and
          find recipes from the internet that match what you actually love eating.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/add"
            className="rounded-full bg-black px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:opacity-80"
          >
            Add Dish
          </Link>

          <Link
            href="/internet-recipes"
            className="rounded-full border border-black px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
          >
            Search Recipes
          </Link>
        </div>
      </section>

      {loading && <p className="text-gray-700">Loading...</p>}

      {error && (
        <p className="mb-4 text-red-600">
          Error loading dishes: {error}
        </p>
      )}

      {!loading && !isLoggedIn && (
        <section className="mx-auto mb-10 max-w-xl rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm">
          <h2 className="mb-2 text-2xl font-black text-black">
            Log in to start your TasteMap
          </h2>

          <p className="mb-5 text-gray-700">
            Create an account so your dishes, rankings, and recommendations are
            saved to your own profile.
          </p>

          <Link
            href="/login"
            className="rounded-full bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            Log In
          </Link>
        </section>
      )}

      {!loading && isLoggedIn && (
        <>
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
              <p className="mt-2 text-xl font-bold text-gray-900">
                {topTag}
              </p>
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
                  <div
                    key={recipe.id}
                    className="rounded-xl bg-white p-4 shadow"
                  >
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
        </>
      )}
    </main>
  );
}