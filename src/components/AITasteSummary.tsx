"use client";

import { useState } from "react";
import { ErrorMessage, cardClass, primaryButtonClass } from "@/components/ui";
import { fetchJson } from "@/lib/fetchJson";
import { Dish } from "@/types/food";

export default function AITasteSummary({ dishes }: { dishes: Dish[] }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateSummary() {
    if (loading) return;
    setLoading(true);
    setError("");

    const { data, error } = await fetchJson<{ summary: string }>(
      "/api/ai/taste-summary",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishes }),
      }
    );

    if (error) setError(error);
    else setSummary(data?.summary || "");
    setLoading(false);
  }

  return (
    <section className={`${cardClass} p-6`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-black">✨ AI Taste Summary</h2>
          <p className="text-sm text-gray-600">
            What your saved dishes say about your taste.
          </p>
        </div>

        <button
          type="button"
          onClick={generateSummary}
          disabled={loading}
          className={primaryButtonClass}
        >
          {loading ? "Thinking..." : summary ? "Regenerate" : "Generate"}
        </button>
      </div>

      <ErrorMessage message={error} />

      {loading && !summary && (
        <div className="grid animate-pulse gap-2">
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-5/6 rounded bg-gray-200" />
          <div className="h-3 w-4/6 rounded bg-gray-200" />
        </div>
      )}

      {summary && (
        <p className="whitespace-pre-line leading-7 text-gray-800">{summary}</p>
      )}
    </section>
  );
}
