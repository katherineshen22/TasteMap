"use client";

import { useState } from "react";
import Image from "next/image";

type InternetRecipe = {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  summary?: string;
};

type InternetRecipeSearchProps = {
  defaultCuisine?: string;
  defaultQuery?: string;
  defaultTags?: string;
};

export default function InternetRecipeSearch({
  defaultCuisine = "",
  defaultQuery = "",
  defaultTags = "",
}: InternetRecipeSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [cuisine, setCuisine] = useState(defaultCuisine);
  const [tags, setTags] = useState(defaultTags);
  const [maxReadyTime, setMaxReadyTime] = useState("");
  const [recipes, setRecipes] = useState<InternetRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchRecipes() {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    if (query) params.set("query", query);
    if (cuisine) params.set("cuisine", cuisine);
    if (tags) params.set("tags", tags);
    if (maxReadyTime) params.set("maxReadyTime", maxReadyTime);

    const response = await fetch(`/api/search-recipes?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Something went wrong while searching recipes.");
      setLoading(false);
      return;
    }

    setRecipes(data.results || []);
    setLoading(false);
  }

  return (
    <section className="max-w-4xl">
      <div className="mb-6 grid gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-4">
        <input
          className="rounded-lg border p-2 text-gray-900"
          placeholder="Search recipe, e.g. ramen"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <input
          className="rounded-lg border p-2 text-gray-900"
          placeholder="Cuisine, e.g. Japanese"
          value={cuisine}
          onChange={(event) => setCuisine(event.target.value)}
        />

        <input
          className="rounded-lg border p-2 text-gray-900"
          placeholder="Tags, e.g. spicy"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />

        <input
          className="rounded-lg border p-2 text-gray-900"
          type="number"
          placeholder="Max minutes"
          value={maxReadyTime}
          onChange={(event) => setMaxReadyTime(event.target.value)}
        />

        <button
          type="button"
          onClick={searchRecipes}
          className="rounded-lg bg-black p-3 font-semibold text-white md:col-span-4"
        >
          {loading ? "Searching..." : "Search Internet Recipes"}
        </button>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {recipes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="rounded-xl bg-white p-4 shadow">
              {recipe.image && (
                <Image
                    src={recipe.image}
                    alt={recipe.title}
                    width={500}
                    height={300}
                    className="mb-3 h-40 w-full rounded-lg object-cover"
                />
              )}

              <h3 className="text-xl font-semibold text-gray-900">
                {recipe.title}
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                {recipe.readyInMinutes || "?"} min ·{" "}
                {recipe.servings || "?"} servings
              </p>

              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  className="mt-3 inline-block text-sm font-semibold text-gray-900 underline"
                >
                  Open recipe
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}