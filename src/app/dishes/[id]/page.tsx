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
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { useRequireUser } from "@/hooks/useRequireUser";
import { recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";
import {
  formatLocation,
  formatPrice,
  formatVisitDate,
  googleMapsUrl,
} from "@/lib/formatters";
import { Avatar } from "@/components/social";
import { displayName, getProfile } from "@/lib/social";
import { supabase } from "@/lib/supabaseClient";
import { Dish, Profile } from "@/types/food";

export default function DishDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useRequireUser();

  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  // allDishes includes this dish, so one request covers every photo here.
  const photoUrls = usePhotoUrls(allDishes.map((d) => d.photo_path));

  const [owner, setOwner] = useState<Profile | null>(null);
  const [savedToList, setSavedToList] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      // No user_id filter: row-level security returns the dish only if it's
      // yours or you're allowed to see its owner's dishes.
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      const found = (data as Dish) || null;
      setDish(found);
      setLoading(false);
      if (!found?.user_id) return;

      // The owner's other dishes, for "More from this restaurant".
      const [others, ownerProfile] = await Promise.all([
        supabase
          .from("dishes")
          .select("*")
          .eq("user_id", found.user_id)
          .order("rating", { ascending: false, nullsFirst: false }),
        found.user_id === user.id ? Promise.resolve(null) : getProfile(found.user_id),
      ]);
      if (cancelled) return;
      setAllDishes((others.data as Dish[]) || []);
      setOwner(ownerProfile);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  // Copy a friend's dish into my Want to Try list.
  async function saveToWantToTry() {
    if (!user || !dish || saving) return;
    setSaving(true);
    const { error } = await supabase.from("dishes").insert({
      user_id: user.id,
      status: "want_to_try",
      rating: null,
      restaurant: dish.restaurant,
      dish: dish.dish,
      cuisine: dish.cuisine,
      city: dish.city,
      neighborhood: dish.neighborhood,
      price_level: dish.price_level,
      tags: dish.tags || [],
      notes: owner ? `Recommended by @${owner.username}` : "",
    });
    setSaving(false);
    if (error) setError(`Couldn't save: ${error.message}`);
    else setSavedToList(true);
  }

  if (!user || loading) return <LoadingState label="Loading dish..." />;

  if (!dish) {
    return (
      <>
        <ErrorMessage message={error} />
        <EmptyState
          title="Dish not found"
          description="It may have been deleted, or it belongs to a private account you don't follow."
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
  const wantToTry = dish.status === "want_to_try" || dish.rating == null;
  const photoUrl = dish.photo_path ? photoUrls[dish.photo_path] : undefined;
  const isOwner = dish.user_id === user.id;

  return (
    <>
      {isOwner ? (
        <Link
          href={wantToTry ? "/want-to-try" : "/rankings"}
          className="mb-6 inline-block text-sm font-semibold text-gray-600 hover:text-black"
        >
          ← Back to {wantToTry ? "Want to Try" : "rankings"}
        </Link>
      ) : (
        owner && (
          <Link
            href={`/u/${owner.username}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black"
          >
            <Avatar profile={owner} size="sm" />
            {displayName(owner)}
            <span className="font-normal text-gray-500">
              {wantToTry ? "wants to try this" : "rated this"}
            </span>
          </Link>
        )
      )}

      <section className={`${cardClass} mb-10 overflow-hidden p-0`}>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL
          <img
            src={photoUrl}
            alt={dish.dish || dish.restaurant}
            className="max-h-[28rem] w-full object-cover"
          />
        )}
        <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              {[dish.restaurant, dish.cuisine, formatPrice(dish.price_level)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h1 className="mt-1 text-3xl font-black text-black sm:text-4xl">
              {dish.dish || dish.restaurant}
            </h1>
            {location && !isOwner && (
              <p className="mt-2 text-sm text-gray-600">📍 {location}</p>
            )}
            {location && isOwner && (
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
            {wantToTry || dish.rating == null ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                ☆ Want to try
              </span>
            ) : (
              <RatingBadge rating={dish.rating} />
            )}
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

        {isOwner ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {wantToTry && (
              <Link
                href={`/dishes/${dish.id}/edit?tried=1`}
                className={primaryButtonClass}
              >
                ✓ Mark as Tried
              </Link>
            )}
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
            <Link
              href={`/add?restaurant=${encodeURIComponent(dish.restaurant)}`}
              className={secondaryButtonClass}
            >
              + Add Dish Here
            </Link>
            <DeleteDishButton
              dishId={dish.id}
              photoPath={dish.photo_path}
              redirectTo={wantToTry ? "/want-to-try" : "/rankings"}
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            {savedToList ? (
              <Link href="/want-to-try" className={secondaryButtonClass}>
                ✓ Saved to your Want to Try
              </Link>
            ) : (
              <button
                type="button"
                onClick={saveToWantToTry}
                disabled={saving}
                className={primaryButtonClass}
              >
                {saving ? "Saving..." : "☆ Save to Want to Try"}
              </button>
            )}
            <a
              href={googleMapsUrl(dish)}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryButtonClass}
            >
              Open in Maps ↗
            </a>
          </div>
        )}
        </div>
      </section>

      {moreHere.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-black text-black">
            {isOwner ? "More" : `More ${owner ? displayName(owner) : "they"} had`} from {dish.restaurant}
          </h2>
          <div className="grid gap-3">
            {moreHere.map((other) => (
              <DishCard
                key={other.id}
                dish={other}
                photoUrl={other.photo_path ? photoUrls[other.photo_path] : undefined}
              />
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
          defaultQuery={dish.dish || dish.cuisine}
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
