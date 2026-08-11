"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";

export default function RecipesPage() {
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
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setDishes((data || []) as Dish[]);
      }

      setLoading(false);
    }

    loadDishes();
  }, []);

  const recommendedRecipes = recommendRecipes(dishes, recipes);

  return (
    <main className="min-h-screen bg-[#faf7ef] p-8">
      <Navbar />

      <h1 className="mb-2 text-4xl font-black text-black">
        Recommended Recipes
      </h1>

      <p className="mb-8 text-gray-700">
        Recipes matched to the restaurant dishes you rated highly.
      </p>

      {loading && <p className="text-gray-700">Loading...</p>}

      {!loading && !isLoggedIn && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="mb-4 text-gray-700">
            Please log in to see personalized recipe recommendations.
          </p>

          <Link
            href="/login"
            className="rounded-full bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            Log In
          </Link>
        </div>
      )}

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {!loading && isLoggedIn && dishes.length === 0 && (
        <p className="text-gray-700">
          Add some dishes first so TasteMap can recommend recipes based on your taste.
        </p>
      )}

      {!loading && isLoggedIn && dishes.length > 0 && (
        <div className="grid max-w-3xl gap-4">
          {recommendedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {recipe.title}
              </h2>

              <p className="text-gray-600">
                {recipe.cuisine} · {recipe.timeMinutes} min · {recipe.difficulty}
              </p>

              <p className="mt-1 text-sm text-gray-500">{recipe.reason}</p>

              <p className="mt-2 text-sm text-gray-800">
                Match score:{" "}
                <span className="font-semibold">{recipe.score}</span>
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Tags: {recipe.tags.join(", ")}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Ingredients: {recipe.ingredients.join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}