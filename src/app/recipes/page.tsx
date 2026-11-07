"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ErrorMessage,
  LoadingState,
  LoginPrompt,
  PageHeader,
  RatingBadge,
  TagPill,
  cardClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { useUserDishes } from "@/hooks/useUserDishes";
import { recipes } from "@/data/sampleData";
import { formatMinutes, safeHttpUrl } from "@/lib/formatters";
import { recommendRecipes } from "@/lib/recommendations";
import { supabase } from "@/lib/supabaseClient";
import { SavedRecipe } from "@/types/food";

export default function RecipesPage() {
  const { status, user, dishes, error } = useUserDishes();
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState("");
  const [search, setSearch] = useState("");
  const photoUrls = usePhotoUrls(saved.map((r) => r.photo_path));

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setSavedError(error.message);
        setSaved((data as SavedRecipe[]) || []);
        setSavedLoading(false);
      });
  }, [user]);

  const searchText = search.trim().toLowerCase();
  const shown = searchText
    ? saved.filter((recipe) =>
        [recipe.title, recipe.cuisine, recipe.notes, ...recipe.tags, ...recipe.ingredients]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(searchText))
      )
    : saved;

  const recommended = recommendRecipes(dishes, recipes).filter((r) => r.score > 0);

  return (
    <>
      <PageHeader
        title="Recipes"
        description="Your own recipes and ones you've saved from the web."
        action={
          status === "ready" && (
            <div className="flex flex-wrap gap-2">
              <Link href="/internet-recipes" className={secondaryButtonClass}>
                Search the Web
              </Link>
              <Link href="/recipes/new" className={primaryButtonClass}>
                + Add Recipe
              </Link>
            </div>
          )
        }
      />

      {status === "loading" && <LoadingState />}
      <ErrorMessage message={error || savedError} />

      {status === "logged-out" && (
        <LoginPrompt reason="Log in to save recipes and get recommendations." />
      )}

      {status === "ready" && (
        <>
          <section className="mb-12">
            {savedLoading ? (
              <LoadingState label="Loading your recipes..." />
            ) : saved.length === 0 ? (
              <div className={`${cardClass} py-10 text-center`}>
                <h2 className="text-xl font-black text-black">No saved recipes yet</h2>
                <p className="mx-auto mt-2 max-w-md text-gray-600">
                  Paste a link from any recipe site to import it, or write down
                  your own family favorites.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/recipes/new" className={primaryButtonClass}>
                    Import or Write a Recipe
                  </Link>
                  <Link href="/internet-recipes" className={secondaryButtonClass}>
                    Browse Online
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {saved.length > 3 && (
                  <input
                    type="search"
                    className={`${inputClass} mb-4`}
                    placeholder="Search your recipes by name, ingredient, or tag..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search your recipes"
                  />
                )}
                {shown.length === 0 && (
                  <p className="py-6 text-center text-gray-600">
                    No recipes match &ldquo;{search}&rdquo;.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((recipe) => {
                    const image =
                      (recipe.photo_path && photoUrls[recipe.photo_path]) ||
                      safeHttpUrl(recipe.image_url);
                    return (
                      <Link
                        key={recipe.id}
                        href={`/recipes/${recipe.id}`}
                        className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element -- signed/external URL
                          <img
                            src={image}
                            alt=""
                            loading="lazy"
                            className="h-40 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-40 items-center justify-center bg-[#f1ece0] text-4xl">
                            🍳
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-gray-900 group-hover:underline">
                              {recipe.title}
                            </h3>
                            {recipe.rating != null && <RatingBadge rating={recipe.rating} />}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {[
                              recipe.cuisine,
                              formatMinutes(recipe.total_minutes),
                              recipe.source_url ? "Imported" : "My recipe",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {recommended.length > 0 && (
            <section>
              <h2 className="mb-1 text-2xl font-black text-black">
                Ideas based on your taste
              </h2>
              <p className="mb-4 text-sm text-gray-600">
                Matched to the dishes you rated 8 or higher.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {recommended.map((recipe) => (
                  <div key={recipe.id} className={cardClass}>
                    <h3 className="text-lg font-bold text-gray-900">{recipe.title}</h3>
                    <p className="text-sm text-gray-600">
                      {recipe.cuisine} · {recipe.timeMinutes} min · {recipe.difficulty}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">{recipe.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {recipe.tags.map((tag) => (
                        <TagPill key={tag} tag={tag} />
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      <span className="font-semibold text-gray-800">Ingredients:</span>{" "}
                      {recipe.ingredients.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
