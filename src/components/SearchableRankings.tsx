"use client";

import { useState } from "react";
import DishCard from "@/components/DishCard";
import { inputClass } from "@/components/ui";
import { Dish } from "@/types/food";

export default function SearchableRankings({ dishes }: { dishes: Dish[] }) {
  const [search, setSearch] = useState("");
  const searchText = search.trim().toLowerCase();

  // Keep each dish's overall rank so numbers don't shift while searching.
  const ranked = dishes.map((dish, index) => ({ dish, rank: index + 1 }));

  const filtered = ranked.filter(({ dish }) => {
    if (!searchText) return true;
    return [dish.dish, dish.restaurant, dish.cuisine, dish.tags?.join(" ")]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(searchText));
  });

  return (
    <section>
      <div className="relative mb-6">
        <input
          type="search"
          className={inputClass}
          placeholder="Search by dish, restaurant, cuisine, or tag..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search dishes"
        />
      </div>

      {searchText && (
        <p className="mb-3 text-sm text-gray-500">
          {filtered.length} of {dishes.length} dishes
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-gray-600">
          No dishes match &ldquo;{search}&rdquo;.{" "}
          <button
            type="button"
            className="font-semibold text-black underline"
            onClick={() => setSearch("")}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(({ dish, rank }) => (
            <DishCard key={dish.id} dish={dish} rank={rank} showNotes />
          ))}
        </div>
      )}
    </section>
  );
}
