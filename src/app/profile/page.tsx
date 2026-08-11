"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AITasteSummary from "@/components/AITasteSummary";
import AIRestaurantIdeas from "@/components/AIRestaurantIdeas";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";

export default function ProfilePage() {
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

      <h1 className="mb-2 text-4xl font-black text-black">Profile</h1>

      <p className="mb-8 text-gray-700">
        Your TasteMap summary based on the dishes you have saved.
      </p>

      {loading && <p className="text-gray-700">Loading profile...</p>}

      {!loading && !isLoggedIn && (
        <div className="max-w-xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="mb-4 text-gray-700">
            Please log in to see your personal TasteMap profile.
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

      {!loading && isLoggedIn && (
        <>
          <section className="mb-8 grid max-w-4xl gap-4 md:grid-cols-4">
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

          {dishes.length === 0 ? (
            <p className="text-gray-700">
              Add your first dish so TasteMap can build your profile.
            </p>
          ) : (
            <>
              <AITasteSummary dishes={dishes} />
              <AIRestaurantIdeas dishes={dishes} />
            </>
          )}
        </>
      )}
    </main>
  );
}