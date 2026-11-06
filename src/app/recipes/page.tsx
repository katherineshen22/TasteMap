"use client";

import Link from "next/link";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
  LoginPrompt,
  PageHeader,
  TagPill,
  cardClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useUserDishes } from "@/hooks/useUserDishes";
import { recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";

export default function RecipesPage() {
  const { status, dishes, error } = useUserDishes();
  const recommendedRecipes = recommendRecipes(dishes, recipes);

  return (
    <>
      <PageHeader
        title="Recommended Recipes"
        description="Recipes matched to the dishes you rated highly (8+)."
        action={
          <Link href="/internet-recipes" className={secondaryButtonClass}>
            Search the Web
          </Link>
        }
      />

      {status === "loading" && <LoadingState />}
      <ErrorMessage message={error} />

      {status === "logged-out" && (
        <LoginPrompt reason="Log in to get recipe recommendations based on your taste." />
      )}

      {status === "ready" && dishes.length === 0 && !error && (
        <EmptyState
          title="No recommendations yet"
          description="Add a few dishes you loved so TasteMap can recommend recipes."
          actionHref="/add"
          actionLabel="Add a Dish"
        />
      )}

      {status === "ready" && dishes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {recommendedRecipes.map((recipe) => (
            <div key={recipe.id} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {recipe.title}
                </h2>
                {recipe.score > 0 && (
                  <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">
                    Match {recipe.score}
                  </span>
                )}
              </div>

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
      )}
    </>
  );
}
