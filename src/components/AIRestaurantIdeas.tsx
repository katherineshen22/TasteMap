"use client";

import { useState } from "react";
import { ErrorMessage, cardClass, primaryButtonClass } from "@/components/ui";
import { fetchJson } from "@/lib/fetchJson";
import { Dish } from "@/types/food";

export default function AIRestaurantIdeas({ dishes }: { dishes: Dish[] }) {
  const [queries, setQueries] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      body: JSON.stringify({ dishes }),
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

        <button
          type="button"
          onClick={generateIdeas}
          disabled={loading}
          className={primaryButtonClass}
        >
          {loading ? "Thinking..." : queries.length ? "Regenerate" : "Generate"}
        </button>
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
