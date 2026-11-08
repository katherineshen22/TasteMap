"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DishCard from "@/components/DishCard";
import { Avatar, FollowButton, PersonRow } from "@/components/social";
import {
  EmptyState,
  LoadingState,
  LoginPrompt,
  RatingBadge,
  cardClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useMyProfile } from "@/hooks/useMyProfile";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { formatMinutes, safeHttpUrl } from "@/lib/formatters";
import {
  displayName,
  getFollow,
  getFollowCounts,
  getFollowList,
  getProfileByUsername,
} from "@/lib/social";
import { supabase } from "@/lib/supabaseClient";
import { Dish, FollowStatus, Profile, SavedRecipe } from "@/types/food";

type Tab = "dishes" | "want" | "recipes" | "followers" | "following";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { status, user } = useMyProfile();

  const [person, setPerson] = useState<Profile | null | undefined>(undefined);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [tab, setTab] = useState<Tab>("dishes");

  const isMe = user?.id === person?.id;
  const canView = Boolean(
    person && (isMe || !person.is_private || followStatus === "accepted")
  );

  const photoUrls = usePhotoUrls([
    ...dishes.map((d) => d.photo_path),
    ...recipes.map((r) => r.photo_path),
  ]);

  // Profile + my relationship to them.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const found = await getProfileByUsername(decodeURIComponent(username));
      if (cancelled) return;
      setPerson(found);
      if (!found) return;
      const [row, followCounts] = await Promise.all([
        getFollow(user.id, found.id),
        getFollowCounts(found.id),
      ]);
      if (cancelled) return;
      setFollowStatus(row?.status ?? null);
      setCounts(followCounts);
    })();
    return () => {
      cancelled = true;
    };
  }, [username, user]);

  // Their content, once we know we're allowed to see it (RLS enforces this
  // too; checking first just avoids empty requests).
  const loadContent = useCallback(async () => {
    if (!person || !canView) {
      setDishes([]);
      setRecipes([]);
      return;
    }
    const [dishRows, recipeRows] = await Promise.all([
      supabase
        .from("dishes")
        .select("*")
        .eq("user_id", person.id)
        .order("rating", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("user_recipes")
        .select("*")
        .eq("user_id", person.id)
        .order("created_at", { ascending: false }),
    ]);
    setDishes((dishRows.data as Dish[]) || []);
    setRecipes((recipeRows.data as SavedRecipe[]) || []);
  }, [person, canView]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (!person || !canView || (tab !== "followers" && tab !== "following")) return;
    getFollowList(person.id, tab).then(setPeople);
  }, [person, canView, tab]);

  if (status === "loading" || (user && person === undefined)) return <LoadingState />;
  if (status === "logged-out") return <LoginPrompt reason="Log in to see profiles." />;

  if (!person) {
    return (
      <EmptyState
        title="User not found"
        description={`No one has the username @${username}.`}
        actionHref="/people"
        actionLabel="Find People"
      />
    );
  }

  const tried = dishes.filter((d) => d.status !== "want_to_try");
  const wantToTry = dishes.filter((d) => d.status === "want_to_try");

  const tabs: [Tab, string, number][] = [
    ["dishes", "Dishes", tried.length],
    ["want", "Want to Try", wantToTry.length],
    ["recipes", "Recipes", recipes.length],
  ];

  return (
    <>
      <section className={`${cardClass} mb-8 p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start gap-5">
          <Avatar profile={person} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-black text-black">
                  {displayName(person)}
                  {person.is_private && (
                    <span className="ml-2 text-lg" title="Private account">🔒</span>
                  )}
                </h1>
                <p className="text-gray-500">@{person.username}</p>
              </div>
              {isMe ? (
                <Link href="/settings/profile" className={secondaryButtonClass}>
                  Edit Profile
                </Link>
              ) : (
                user && (
                  <FollowButton
                    myId={user.id}
                    target={person}
                    onChange={(next) => {
                      setFollowStatus(next);
                      getFollowCounts(person.id).then(setCounts);
                    }}
                  />
                )
              )}
            </div>
            {person.bio && <p className="mt-3 text-gray-700">{person.bio}</p>}
            <div className="mt-4 flex gap-5 text-sm">
              <span>
                <b className="text-black">{tried.length}</b>{" "}
                <span className="text-gray-500">dishes</span>
              </span>
              <button
                type="button"
                onClick={() => canView && setTab("followers")}
                className={canView ? "hover:underline" : "cursor-default"}
              >
                <b className="text-black">{counts.followers}</b>{" "}
                <span className="text-gray-500">followers</span>
              </button>
              <button
                type="button"
                onClick={() => canView && setTab("following")}
                className={canView ? "hover:underline" : "cursor-default"}
              >
                <b className="text-black">{counts.following}</b>{" "}
                <span className="text-gray-500">following</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {!canView ? (
        <div className={`${cardClass} py-12 text-center`}>
          <p className="text-4xl">🔒</p>
          <h2 className="mt-2 text-xl font-black text-black">This account is private</h2>
          <p className="mx-auto mt-2 max-w-sm text-gray-600">
            {followStatus === "pending"
              ? `Your request is waiting for ${displayName(person)} to approve it.`
              : `Follow ${displayName(person)} to see their dishes and recipes.`}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 flex gap-1 overflow-x-auto rounded-full border border-black/10 bg-white p-1 text-sm font-semibold">
            {tabs.map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`shrink-0 rounded-full px-4 py-2 ${
                  tab === value ? "bg-black text-white" : "text-gray-600 hover:text-black"
                }`}
              >
                {label} <span className="opacity-60">{count}</span>
              </button>
            ))}
          </div>

          {(tab === "dishes" || tab === "want") && (
            <div className="grid gap-3">
              {(tab === "dishes" ? tried : wantToTry).length === 0 ? (
                <p className="py-8 text-center text-gray-500">Nothing here yet.</p>
              ) : (
                (tab === "dishes" ? tried : wantToTry).map((dish, index) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    rank={tab === "dishes" ? index + 1 : undefined}
                    photoUrl={dish.photo_path ? photoUrls[dish.photo_path] : undefined}
                    showNotes
                  />
                ))
              )}
            </div>
          )}

          {tab === "recipes" &&
            (recipes.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No recipes yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe) => {
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
                        <img src={image} alt="" loading="lazy" className="h-40 w-full object-cover" />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-[#f1ece0] text-4xl">🍳</div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 group-hover:underline">{recipe.title}</h3>
                          {recipe.rating != null && <RatingBadge rating={recipe.rating} />}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {[recipe.cuisine, formatMinutes(recipe.total_minutes), recipe.source_url ? "Saved" : "Original"]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}

          {(tab === "followers" || tab === "following") && (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setTab("dishes")}
                className="mb-2 justify-self-start text-sm font-semibold text-gray-600 hover:text-black"
              >
                ← Back to dishes
              </button>
              {people.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No one yet.</p>
              ) : (
                people.map((p) => <PersonRow key={p.id} profile={p} myId={user?.id} />)
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
