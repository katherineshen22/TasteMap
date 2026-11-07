"use client";

import { useState } from "react";
import { ErrorMessage, cardClass, primaryButtonClass } from "@/components/ui";
import { fetchJson } from "@/lib/fetchJson";
import { uniqueSorted } from "@/lib/formatters";
import { Dish } from "@/types/food";

export default function AIRestaurantIdeas({ dishes }: { dishes: Dish[] }) {
  const [queries, setQueries] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cityOptions = uniqueSorted(dishes.map((dish) => dish.city));
  // Default to the city you've logged the most dishes in.
  const [city, setCity] = useState(() => {
    const counts = new Map<string, number>();
    dishes.forEach((dish) => {
      if (dish.city) counts.set(dish.city, (counts.get(dish.city) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  });

  async function generateIdeas() {
    if (loading) return;
    setLoading(true);
    setError("");

    const { data, error } = await fetchJson<{
      queries?: string[];
      explanation?: string;
    }>("/api/ai/restaurant-queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishes, city }),
    });

    if (error) {
      setError(error);
    } else {
      setQueries(data?.queries || []);
      setExplanation(data?.explanation || "");
    }
    setLoading(false);
  }

  return (
    <section className={`${cardClass} p-6`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-black">
            ✨ AI Restaurant Ideas
          </h2>
          <p className="text-sm text-gray-600">
            Restaurant searches to try next. Tap one to search Google Maps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-40 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
            placeholder="📍 Any city"
            list="ai-city-options"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="City to find restaurants in"
          />
          <datalist id="ai-city-options">
            {cityOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={generateIdeas}
            disabled={loading}
            className={primaryButtonClass}
          >
            {loading ? "Thinking..." : queries.length ? "Regenerate" : "Generate"}
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />

      {explanation && (
        <p className="mb-4 leading-7 text-gray-800">{explanation}</p>
      )}

      {queries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {queries.map((query) => (
            <a
              key={query}
              href={`https://www.google.com/maps/search/${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-black/10 bg-[#faf7ef] px-4 py-2 text-sm font-semibold text-gray-900 transition hover:border-black"
            >
              📍 {query}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
