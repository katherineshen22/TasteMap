"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ErrorMessage,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { fetchJson } from "@/lib/fetchJson";

type InternetRecipe = {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
};

type InternetRecipeSearchProps = {
  defaultCuisine?: string;
  defaultQuery?: string;
  dishForAI?: {
    restaurant: string;
    dish: string;
    cuisine: string;
    tags: string[];
    notes: string;
  };
};

const dietOptions = [
  "", "vegetarian", "vegan", "gluten free", "ketogenic", "pescetarian", "paleo",
];

export default function InternetRecipeSearch({
  defaultCuisine = "",
  defaultQuery = "",
  dishForAI,
}: InternetRecipeSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [cuisine, setCuisine] = useState(defaultCuisine);
  const [diet, setDiet] = useState("");
  const [maxReadyTime, setMaxReadyTime] = useState("");
  const [recipes, setRecipes] = useState<InternetRecipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchRecipes(searchQuery = query) {
    if (loading) return;
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("query", searchQuery.trim());
    if (cuisine.trim()) params.set("cuisine", cuisine.trim());
    if (diet) params.set("diet", diet);
    if (maxReadyTime) params.set("maxReadyTime", maxReadyTime);

    const { data, error } = await fetchJson<{ results?: InternetRecipe[] }>(
      `/api/search-recipes?${params.toString()}`
    );

    if (error) {
      setError(error);
    } else {
      setRecipes(data?.results || []);
      setHasSearched(true);
    }
    setLoading(false);
  }

  async function generateSmarterSearch() {
    if (!dishForAI || aiLoading) return;
    setAiLoading(true);
    setError("");

    const { data, error } = await fetchJson<{ query: string }>(
      "/api/ai/recipe-query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish: dishForAI }),
      }
    );

    setAiLoading(false);

    if (error || !data?.query) {
      setError(error || "Could not generate a smarter search.");
      return;
    }

    setQuery(data.query);
    // The AI query already captures the cuisine, so don't double-filter.
    setCuisine("");
    await searchRecipes(data.query);
  }

  return (
    <section>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          searchRecipes();
        }}
        className="mb-6 grid gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="grid gap-1 text-sm font-medium text-gray-700 sm:col-span-2">
          Recipe
          <input
            className={inputClass}
            placeholder="e.g. ramen, tacos, pad thai"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-gray-700">
          Cuisine
          <input
            className={inputClass}
            placeholder="e.g. Japanese"
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-gray-700">
          Max cooking time
          <select
            className={inputClass}
            value={maxReadyTime}
            onChange={(event) => setMaxReadyTime(event.target.value)}
          >
            <option value="">Any</option>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hour</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-gray-700">
          Diet
          <select
            className={inputClass}
            value={diet}
            onChange={(event) => setDiet(event.target.value)}
          >
            {dietOptions.map((option) => (
              <option key={option} value={option}>
                {option ? option[0].toUpperCase() + option.slice(1) : "Any"}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={loading || aiLoading}
            className={primaryButtonClass}
          >
            {loading ? "Searching..." : "Search Recipes"}
          </button>

          {dishForAI && (
            <button
              type="button"
              onClick={generateSmarterSearch}
              disabled={loading || aiLoading}
              className={secondaryButtonClass}
              title="Uses AI to write a better search based on this dish"
            >
              {aiLoading ? "Thinking..." : "✨ AI Smart Search"}
            </button>
          )}
        </div>
      </form>

      <ErrorMessage message={error} />

      {hasSearched && recipes.length === 0 && !loading && !error && (
        <p className="py-6 text-center text-gray-600">
          No recipes found. Try a simpler search, or remove the cuisine or time
          filters.
        </p>
      )}

      {recipes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <a
              key={recipe.id}
              href={recipe.sourceUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {recipe.image ? (
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  width={500}
                  height={300}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="flex h-44 items-center justify-center bg-[#f1ece0] text-4xl">
                  🍽️
                </div>
              )}

              <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:underline">
                  {recipe.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : ""}
                  {recipe.readyInMinutes && recipe.servings ? " · " : ""}
                  {recipe.servings ? `${recipe.servings} servings` : ""}
                </p>
                {recipe.sourceUrl && (
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    Open recipe ↗
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
