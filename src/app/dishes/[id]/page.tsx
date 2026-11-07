"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DeleteDishButton from "@/components/DeleteDishButton";
import DishCard from "@/components/DishCard";
import InternetRecipeSearch from "@/components/InternetRecipeSearch";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
  RatingBadge,
  TagPill,
  cardClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useRequireUser } from "@/hooks/useRequireUser";
import { recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";
import {
  formatLocation,
  formatPrice,
  formatVisitDate,
  googleMapsUrl,
} from "@/lib/formatters";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";

export default function DishDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useRequireUser();

  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allDishes, setAllDishes] = useState<Dish[]>([]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("dishes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setDish((data as Dish) || null);
        setLoading(false);
      });

    // Load the user's dishes so we can show what else they had here.
    supabase
      .from("dishes")
      .select("*")
      .eq("user_id", user.id)
      .order("rating", { ascending: false })
      .then(({ data }) => setAllDishes((data as Dish[]) || []));
  }, [id, user]);

  if (!user || loading) return <LoadingState label="Loading dish..." />;

  if (!dish) {
    return (
      <>
        <ErrorMessage message={error} />
        <EmptyState
          title="Dish not found"
          description="It may have been deleted, or it belongs to a different account."
          actionHref="/rankings"
          actionLabel="Back to Rankings"
        />
      </>
    );
  }

  // Treat this one dish as "liked" so we always get relevant matches.
  const matchingRecipes = recommendRecipes(
    [{ ...dish, rating: 10 }],
    recipes
  ).slice(0, 3);

  const sameRestaurant = (other: Dish) =>
    other.id !== dish.id &&
    other.restaurant.trim().toLowerCase() === dish.restaurant.trim().toLowerCase() &&
    (other.city || "").toLowerCase() === (dish.city || "").toLowerCase();
  const moreHere = allDishes.filter(sameRestaurant);
  const location = formatLocation(dish);

  return (
    <>
      <Link
        href="/rankings"
        className="mb-6 inline-block text-sm font-semibold text-gray-600 hover:text-black"
      >
        ← Back to rankings
      </Link>

      <section className={`${cardClass} mb-10 p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              {[dish.restaurant, dish.cuisine, formatPrice(dish.price_level)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h1 className="mt-1 text-3xl font-black text-black sm:text-4xl">
              {dish.dish}
            </h1>
            {location && (
              <p className="mt-2 text-sm text-gray-600">
                📍{" "}
                {dish.neighborhood && (
                  <>
                    <Link
                      href={`/rankings?${new URLSearchParams({
                        ...(dish.city ? { city: dish.city } : {}),
                        neighborhood: dish.neighborhood,
                      })}`}
                      className="hover:underline"
                      title="See all your dishes in this neighborhood"
                    >
                      {dish.neighborhood}
                    </Link>
                    {dish.city ? ", " : ""}
                  </>
                )}
                {dish.city && (
                  <Link
                    href={`/rankings?city=${encodeURIComponent(dish.city)}`}
                    className="hover:underline"
                    title="See all your dishes in this city"
                  >
                    {dish.city}
                  </Link>
                )}
              </p>
            )}
          </div>
          <div className="text-xl">
            <RatingBadge rating={dish.rating} />
          </div>
        </div>

        {dish.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {dish.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}

        {dish.notes && (
          <p className="mt-5 whitespace-pre-line leading-7 text-gray-700">
            {dish.notes}
          </p>
        )}

        {(dish.visited_on || dish.created_at) && (
          <p className="mt-5 text-xs text-gray-400">
            {dish.visited_on
              ? `Visited ${formatVisitDate(dish.visited_on)}`
              : `Added ${new Date(dish.created_at!).toLocaleDateString()}`}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/dishes/${dish.id}/edit`} className={secondaryButtonClass}>
            Edit
          </Link>
          <a
            href={googleMapsUrl(dish)}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryButtonClass}
          >
            Open in Maps ↗
          </a>
          <DeleteDishButton dishId={dish.id} />
        </div>
      </section>

      {moreHere.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-black text-black">
            More from {dish.restaurant}
          </h2>
          <div className="grid gap-3">
            {moreHere.map((other) => (
              <DishCard key={other.id} dish={other} />
            ))}
          </div>
        </section>
      )}

      {matchingRecipes.some((recipe) => recipe.score > 0) && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-black text-black">
            Cook something like this
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {matchingRecipes
              .filter((recipe) => recipe.score > 0)
              .map((recipe) => (
                <div key={recipe.id} className={cardClass}>
                  <h3 className="font-bold text-gray-900">{recipe.title}</h3>
                  <p className="text-sm text-gray-600">
                    {recipe.cuisine} · {recipe.timeMinutes} min ·{" "}
                    {recipe.difficulty}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">{recipe.reason}</p>
                </div>
              ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-black text-black">
          Find recipes online
        </h2>
        <InternetRecipeSearch
          defaultQuery={dish.dish}
          defaultCuisine={dish.cuisine}
          dishForAI={{
            restaurant: dish.restaurant,
            dish: dish.dish,
            cuisine: dish.cuisine,
            tags: dish.tags || [],
            notes: dish.notes || "",
          }}
        />
      </section>
    </>
  );
}
