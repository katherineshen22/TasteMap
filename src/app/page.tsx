"use client";

import Link from "next/link";
import DishCard from "@/components/DishCard";
import FriendsFeed from "@/components/FriendsFeed";
import StatCards from "@/components/StatCards";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useUserDishes } from "@/hooks/useUserDishes";
import { recipes } from "@/data/sampleData";
import { recommendRecipes } from "@/lib/recommendations";

export default function Home() {
  const { status, user, dishes, wantToTry, error } = useUserDishes();
  const { status: profileStatus, profile } = useMyProfile();

  const topDishes = dishes.slice(0, 3);
  const recommendedRecipes = recommendRecipes(dishes, recipes).slice(0, 3);

  return (
    <>
      <section className="mb-12 text-center">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-gray-500">
          Your personal food memory map
        </p>

        <h1 className="mb-6 text-5xl font-black tracking-tight text-black sm:text-7xl">
          TasteMap
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-gray-700">
          Track your favorite restaurant dishes, learn your taste patterns, and
          find recipes that match what you actually love eating.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/add" className={primaryButtonClass}>
            + Add a Dish
          </Link>
          <Link href="/internet-recipes" className={secondaryButtonClass}>
            Search Recipes
          </Link>
        </div>
      </section>

      {status === "loading" && <LoadingState />}
      <ErrorMessage message={error} />

      {status === "logged-out" && (
        <section className={`${cardClass} mx-auto max-w-2xl py-10 text-center`}>
          <h2 className="mb-3 text-2xl font-black text-black">
            How TasteMap works
          </h2>
          <ol className="mx-auto mb-6 grid max-w-md gap-2 text-left text-gray-700">
            <li>
              <b>1.</b> Log the dishes you eat at restaurants and rate them.
            </li>
            <li>
              <b>2.</b> See your rankings and taste patterns over time.
            </li>
            <li>
              <b>3.</b> Get recipe and restaurant ideas based on what you love.
            </li>
          </ol>
          <Link href="/login" className={primaryButtonClass}>
            Get Started — It&apos;s Free
          </Link>
        </section>
      )}

      {status === "ready" && dishes.length === 0 && (
        <EmptyState
          title="Your TasteMap is empty"
          description="Add the first dish you loved and TasteMap will start learning your taste."
          actionHref="/add"
          actionLabel="Add Your First Dish"
        />
      )}

      {status === "ready" && dishes.length > 0 && (
        <>
          <StatCards dishes={dishes} />

          {wantToTry.length > 0 && (
            <Link
              href="/want-to-try"
              className="mb-10 flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 font-semibold text-blue-900 transition hover:border-blue-300"
            >
              <span>
                ☆ {wantToTry.length} place{wantToTry.length === 1 ? "" : "s"} on
                your Want to Try list
              </span>
              <span aria-hidden>→</span>
            </Link>
          )}

          <div className="grid gap-10 lg:grid-cols-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black text-black">Top Dishes</h2>
                <Link
                  href="/rankings"
                  className="text-sm font-semibold text-gray-600 hover:text-black"
                >
                  See all →
                </Link>
              </div>
              <div className="grid gap-3">
                {topDishes.map((dish, index) => (
                  <DishCard key={dish.id} dish={dish} rank={index + 1} />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black text-black">
                  Recipes For You
                </h2>
                <Link
                  href="/recipes"
                  className="text-sm font-semibold text-gray-600 hover:text-black"
                >
                  See all →
                </Link>
              </div>
              <div className="grid gap-3">
                {recommendedRecipes.map((recipe) => (
                  <div key={recipe.id} className={cardClass}>
                    <h3 className="text-lg font-bold text-gray-900">
                      {recipe.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {recipe.cuisine} · {recipe.timeMinutes} min ·{" "}
                      {recipe.difficulty}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">{recipe.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
      {status === "ready" && user && (
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-black">Friends&apos; Activity</h2>
            <Link
              href="/people"
              className="text-sm font-semibold text-gray-600 hover:text-black"
            >
              Find friends →
            </Link>
          </div>

          {profileStatus === "ready" && !profile && (
            <div className={`${cardClass} mb-4 flex flex-wrap items-center justify-between gap-3 bg-[#faf7ef]`}>
              <p className="text-sm text-gray-700">
                <b>Set up your profile</b> so friends can find and follow you.
              </p>
              <Link href="/settings/profile" className={secondaryButtonClass}>
                Create Profile
              </Link>
            </div>
          )}

          <FriendsFeed myId={user.id} />
        </section>
      )}
    </>
  );
}
