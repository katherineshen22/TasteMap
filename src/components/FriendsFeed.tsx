"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/social";
import { RatingBadge, cardClass, primaryButtonClass } from "@/components/ui";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { formatLocation, formatMinutes, safeHttpUrl } from "@/lib/formatters";
import { displayName, getFollowingIds, getProfiles } from "@/lib/social";
import { supabase } from "@/lib/supabaseClient";
import { Dish, Profile, SavedRecipe } from "@/types/food";

type FeedItem =
  | { kind: "dish"; at: string; userId: string; dish: Dish }
  | { kind: "recipe"; at: string; userId: string; recipe: SavedRecipe };

const PAGE = 20;

function timeAgo(iso: string) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return "just now";
  const units: [number, string][] = [
    [60 * 60 * 24 * 7, "w"],
    [60 * 60 * 24, "d"],
    [60 * 60, "h"],
    [60, "m"],
  ];
  for (const [size, label] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label}`;
  }
  return "";
}

export default function FriendsFeed({ myId }: { myId: string }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const photoUrls = usePhotoUrls(
    items.map((item) => (item.kind === "dish" ? item.dish.photo_path : item.recipe.photo_path))
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const ids = await getFollowingIds(myId);
      if (cancelled) return;
      setFollowingCount(ids.length);
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch the newest of each kind, then merge by time.
      const [dishRows, recipeRows, profileMap] = await Promise.all([
        supabase
          .from("dishes")
          .select("*")
          .in("user_id", ids)
          .order("created_at", { ascending: false })
          .limit(limit + 1),
        supabase
          .from("user_recipes")
          .select("*")
          .in("user_id", ids)
          .order("created_at", { ascending: false })
          .limit(limit + 1),
        getProfiles(ids),
      ]);
      if (cancelled) return;

      const dishes = (dishRows.data as Dish[]) || [];
      const recipes = (recipeRows.data as SavedRecipe[]) || [];
      const merged: FeedItem[] = [
        ...dishes.map((dish) => ({
          kind: "dish" as const,
          at: dish.created_at || "",
          userId: dish.user_id || "",
          dish,
        })),
        ...recipes.map((recipe) => ({
          kind: "recipe" as const,
          at: recipe.created_at || "",
          userId: recipe.user_id || "",
          recipe,
        })),
      ].sort((a, b) => b.at.localeCompare(a.at));

      setHasMore(merged.length > limit);
      setItems(merged.slice(0, limit));
      setProfiles(profileMap);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [myId, limit]);

  if (loading && items.length === 0) {
    return <p className="py-6 text-gray-500">Loading your feed...</p>;
  }

  if (followingCount === 0) {
    return (
      <div className={`${cardClass} py-8 text-center`}>
        <p className="text-3xl">👋</p>
        <h3 className="mt-2 font-black text-black">Your feed is empty</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">
          Follow friends to see the dishes they log and the recipes they save.
        </p>
        <Link href="/people" className={`${primaryButtonClass} mt-4`}>
          Find Friends
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className={`${cardClass} py-8 text-center text-gray-600`}>
        The people you follow haven&apos;t posted anything yet.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const person = profiles[item.userId];
        const name = displayName(person);
        let href: string;
        let action: string;
        let title: string;
        let subtitle: string;
        let image: string | null | undefined;
        let rating: number | null = null;

        if (item.kind === "dish") {
          const { dish } = item;
          const wants = dish.status === "want_to_try";
          href = `/dishes/${dish.id}`;
          action = wants ? "wants to try" : "rated";
          title = dish.dish || dish.restaurant;
          subtitle = [dish.dish ? dish.restaurant : "", formatLocation(dish)]
            .filter(Boolean)
            .join(" · ");
          image = dish.photo_path ? photoUrls[dish.photo_path] : null;
          rating = wants ? null : dish.rating;
        } else {
          const { recipe } = item;
          href = `/recipes/${recipe.id}`;
          action = recipe.source_url ? "saved a recipe" : "shared their recipe";
          title = recipe.title;
          subtitle = [recipe.cuisine, formatMinutes(recipe.total_minutes)]
            .filter(Boolean)
            .join(" · ");
          image =
            (recipe.photo_path && photoUrls[recipe.photo_path]) ||
            safeHttpUrl(recipe.image_url);
        }

        return (
          <article
            key={`${item.kind}-${item.kind === "dish" ? item.dish.id : item.recipe.id}`}
            className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2 text-sm">
              <Link href={person ? `/u/${person.username}` : "#"} className="flex items-center gap-2">
                <Avatar profile={person} size="sm" />
                <span className="font-bold text-gray-900 hover:underline">{name}</span>
              </Link>
              <span className="text-gray-500">{action}</span>
              <span className="ml-auto text-xs text-gray-400">{item.at && timeAgo(item.at)}</span>
            </div>

            <Link href={href} className="group flex gap-4">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed/external URL
                <img src={image} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f1ece0] text-2xl">
                  {item.kind === "dish" ? "🍽️" : "🍳"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate text-lg font-bold text-gray-900 group-hover:underline">
                    {title}
                  </h3>
                  {rating != null && <RatingBadge rating={rating} />}
                </div>
                {subtitle && <p className="truncate text-sm text-gray-600">{subtitle}</p>}
                {item.kind === "dish" && item.dish.notes && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    &ldquo;{item.dish.notes}&rdquo;
                  </p>
                )}
              </div>
            </Link>
          </article>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={() => setLimit((current) => current + PAGE)}
          disabled={loading}
          className="justify-self-center rounded-full border border-black/20 px-5 py-2 text-sm font-semibold text-gray-700 hover:border-black disabled:opacity-50"
        >
          {loading ? "Loading..." : "Show more"}
        </button>
      )}
    </div>
  );
}
