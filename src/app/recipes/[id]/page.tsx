"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
  RatingBadge,
  TagPill,
  cardClass,
  secondaryButtonClass,
} from "@/components/ui";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { useRequireUser } from "@/hooks/useRequireUser";
import { formatMinutes, safeHttpUrl } from "@/lib/formatters";
import { deleteDishPhoto } from "@/lib/photos";
import { Avatar } from "@/components/social";
import { displayName, getProfile } from "@/lib/social";
import { supabase } from "@/lib/supabaseClient";
import { Profile, SavedRecipe } from "@/types/food";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useRequireUser();

  const [recipe, setRecipe] = useState<SavedRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [copying, setCopying] = useState(false);

  const photoUrl = usePhotoUrls([recipe?.photo_path])[recipe?.photo_path || ""];

  useEffect(() => {
    if (!user) return;
    // No user_id filter: row-level security decides whether it's visible.
    supabase
      .from("user_recipes")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (error) setError(error.message);
        const found = (data as SavedRecipe) || null;
        setRecipe(found);
        setLoading(false);
        if (found?.user_id && found.user_id !== user.id) {
          setOwner(await getProfile(found.user_id));
        }
      });
  }, [id, user]);

  // Copy a friend's recipe into my own recipes (my notes/rating start blank).
  async function saveCopy() {
    if (!user || !recipe || copying) return;
    setCopying(true);
    const { data, error } = await supabase
      .from("user_recipes")
      .insert({
        user_id: user.id,
        title: recipe.title,
        source_url: recipe.source_url,
        image_url: recipe.image_url,
        cuisine: recipe.cuisine,
        total_minutes: recipe.total_minutes,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        tags: recipe.tags,
        notes: owner ? `From @${owner.username}` : null,
      })
      .select("id")
      .single();
    setCopying(false);
    if (error) setError(`Couldn't save: ${error.message}`);
    else router.push(`/recipes/${data.id}`);
  }

  async function handleDelete() {
    if (!recipe || !window.confirm("Delete this recipe? This can't be undone.")) return;
    setDeleting(true);
    const { error } = await supabase.from("user_recipes").delete().eq("id", recipe.id);
    if (error) {
      setError(`Couldn't delete: ${error.message}`);
      setDeleting(false);
      return;
    }
    await deleteDishPhoto(recipe.photo_path);
    router.push("/recipes");
  }

  function toggleIngredient(index: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  if (!user || loading) return <LoadingState label="Loading recipe..." />;

  if (!recipe) {
    return (
      <>
        <ErrorMessage message={error} />
        <EmptyState
          title="Recipe not found"
          description="It may have been deleted, or it belongs to a private account you don't follow."
          actionHref="/recipes"
          actionLabel="Back to Recipes"
        />
      </>
    );
  }

  const isOwner = recipe.user_id === user.id;
  const image = photoUrl || safeHttpUrl(recipe.image_url);
  const source = safeHttpUrl(recipe.source_url);
  const meta = [
    recipe.cuisine,
    formatMinutes(recipe.total_minutes),
    recipe.servings ? `Serves ${recipe.servings}` : "",
  ].filter(Boolean);

  return (
    <>
      {isOwner ? (
        <Link
          href="/recipes"
          className="mb-6 inline-block text-sm font-semibold text-gray-600 hover:text-black"
        >
          ← Back to recipes
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
              {recipe.source_url ? "saved this recipe" : "shared their recipe"}
            </span>
          </Link>
        )
      )}

      <ErrorMessage message={error} />

      <article className={`${cardClass} overflow-hidden p-0`}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- signed/external URL
          <img src={image} alt={recipe.title} className="max-h-[26rem] w-full object-cover" />
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-black sm:text-4xl">
                {recipe.title}
              </h1>
              {meta.length > 0 && (
                <p className="mt-2 text-sm font-semibold text-gray-600">
                  {meta.join(" · ")}
                </p>
              )}
              {source && (
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-1 inline-block text-sm text-gray-500 underline hover:text-black"
                >
                  From {new URL(source).hostname.replace(/^www\./, "")} ↗
                </a>
              )}
            </div>
            {recipe.rating != null && (
              <div className="text-xl">
                <RatingBadge rating={recipe.rating} />
              </div>
            )}
          </div>

          {recipe.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
          )}

          {recipe.notes && (
            <p className="mt-5 whitespace-pre-line rounded-xl bg-[#faf7ef] p-4 leading-7 text-gray-800">
              📝 {recipe.notes}
            </p>
          )}

          <div className="mt-8 grid gap-8 md:grid-cols-[2fr_3fr]">
            <section>
              <h2 className="mb-3 text-xl font-black text-black">
                Ingredients
                {checked.size > 0 && (
                  <span className="ml-2 text-sm font-semibold text-gray-400">
                    {checked.size}/{recipe.ingredients.length}
                  </span>
                )}
              </h2>
              {recipe.ingredients.length === 0 ? (
                <p className="text-gray-500">No ingredients listed.</p>
              ) : (
                <ul className="grid gap-2">
                  {recipe.ingredients.map((item, index) => (
                    <li key={index}>
                      <label className="flex cursor-pointer gap-3 leading-6">
                        <input
                          type="checkbox"
                          checked={checked.has(index)}
                          onChange={() => toggleIngredient(index)}
                          className="mt-1 h-4 w-4 shrink-0 accent-black"
                        />
                        <span className={checked.has(index) ? "text-gray-400 line-through" : "text-gray-800"}>
                          {item}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-xl font-black text-black">Steps</h2>
              {recipe.instructions.length === 0 ? (
                <p className="text-gray-500">
                  No steps listed.
                  {source && " See the original recipe for directions."}
                </p>
              ) : (
                <ol className="grid gap-4">
                  {recipe.instructions.map((step, index) => (
                    <li key={index} className="flex gap-3 leading-7 text-gray-800">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-black/5 pt-6">
            {!isOwner ? (
              <button
                type="button"
                onClick={saveCopy}
                disabled={copying}
                className={secondaryButtonClass}
              >
                {copying ? "Saving..." : "+ Save to My Recipes"}
              </button>
            ) : (
            <>
            <Link href={`/recipes/${recipe.id}/edit`} className={secondaryButtonClass}>
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-full border border-red-200 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
            </>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
