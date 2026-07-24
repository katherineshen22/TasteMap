"use client";

import { useState } from "react";
import { Dish } from "@/types/food";

type AIRestaurantIdeasProps = {
  dishes: Dish[];
};

export default function AIRestaurantIdeas({ dishes }: AIRestaurantIdeasProps) {
  const [queries, setQueries] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateIdeas() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/ai/restaurant-queries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dishes }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    setQueries(data.queries || []);
    setExplanation(data.explanation || "");
    setLoading(false);
  }

  return (
    <section className="mb-8 max-w-3xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-black">
            AI Restaurant Ideas
          </h2>
          <p className="text-sm text-gray-600">
            Generate restaurant search ideas from your TasteMap profile.
          </p>
        </div>

        <button
          onClick={generateIdeas}
          className="rounded-full bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:opacity-80"
        >
          {loading ? "Thinking..." : "Generate"}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {explanation && (
        <p className="mb-4 leading-7 text-gray-800">{explanation}</p>
      )}

      {queries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {queries.map((query) => (
            <span
              key={query}
              className="rounded-full border border-black/10 bg-[#faf7ef] px-4 py-2 text-sm font-semibold text-gray-900"
            >
              {query}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}