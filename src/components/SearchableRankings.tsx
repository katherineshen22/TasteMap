"use client";

import { useState } from "react";
import Link from "next/link";
import { Dish } from "@/types/food";

type SearchableRankingsProps = {
  dishes: Dish[];
};

export default function SearchableRankings({ dishes }: SearchableRankingsProps) {
  const [search, setSearch] = useState("");

  const filteredDishes = dishes.filter((dish) => {
    const searchText = search.toLowerCase();

    return (
      dish.dish.toLowerCase().includes(searchText) ||
      dish.restaurant.toLowerCase().includes(searchText) ||
      dish.cuisine?.toLowerCase().includes(searchText) ||
      dish.tags?.join(" ").toLowerCase().includes(searchText)
    );
  });

  return (
    <section className="max-w-3xl">
      <input
        className="mb-6 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
        placeholder="Search by dish, restaurant, cuisine, or tag..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {filteredDishes.length === 0 ? (
        <p className="text-gray-700">No dishes match your search.</p>
      ) : (
        <div className="grid gap-4">
          {filteredDishes.map((dish, index) => (
            <Link
              key={dish.id}
              href={`/dishes/${dish.id}`}
              className="block rounded-xl bg-white p-4 shadow transition hover:shadow-md"
            >
              <p className="text-sm text-gray-500">#{index + 1}</p>

              <h2 className="text-xl font-semibold text-gray-900">
                {dish.dish}
              </h2>

              <p className="text-gray-600">{dish.restaurant}</p>

              <p className="font-medium text-gray-800">
                Rating: {dish.rating}/10
              </p>

              <p className="text-sm text-gray-500">
                {dish.tags?.join(", ")}
              </p>

              <p className="mt-2 text-sm text-gray-600">{dish.notes}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}