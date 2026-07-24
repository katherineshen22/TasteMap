"use client";

import { useState } from "react";
import { Dish } from "@/types/food";

type AITasteSummaryProps = {
  dishes: Dish[];
};

export default function AITasteSummary({ dishes }: AITasteSummaryProps) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateSummary() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/ai/taste-summary", {
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

    setSummary(data.summary);
    setLoading(false);
  }

  return (
    <section className="mb-8 max-w-3xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-black">AI Taste Summary</h2>
          <p className="text-sm text-gray-600">
            Generate a quick interpretation of your saved dishes.
          </p>
        </div>

        <button
          onClick={generateSummary}
          className="rounded-full bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:opacity-80"
        >
          {loading ? "Thinking..." : "Generate"}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {summary && (
        <p className="whitespace-pre-line leading-7 text-gray-800">
          {summary}
        </p>
      )}
    </section>
  );
}