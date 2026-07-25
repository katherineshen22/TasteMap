"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import SearchableRankings from "@/components/SearchableRankings";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";
import Link from "next/link";

export default function RankingsPage() {
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

  return (
    <main className="min-h-screen bg-[#faf7ef] p-8">
      <Navbar />

      <h1 className="mb-2 text-4xl font-bold text-gray-900">Dish Rankings</h1>

      <p className="mb-8 text-gray-700">
        Your favorite restaurant dishes, ranked by rating.
      </p>

      {loading && <p className="text-gray-700">Loading...</p>}

      {!loading && !isLoggedIn && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="mb-4 text-gray-700">
            Please log in to see your personal rankings.
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

      {!loading && isLoggedIn && dishes.length === 0 ? (
        <p className="text-gray-700">
          No dishes saved yet. Add your first dish to see rankings.
        </p>
      ) : null}

      {!loading && isLoggedIn && dishes.length > 0 && (
        <SearchableRankings dishes={dishes} />
      )}
    </main>
  );
}