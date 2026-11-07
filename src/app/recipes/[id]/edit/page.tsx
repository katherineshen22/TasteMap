"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RecipeForm, { RecipeFormValues } from "@/components/RecipeForm";
import { EmptyState, ErrorMessage, LoadingState, PageHeader } from "@/components/ui";
import { useRequireUser } from "@/hooks/useRequireUser";
import { supabase } from "@/lib/supabaseClient";
import { SavedRecipe } from "@/types/food";

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useRequireUser();

  const [recipe, setRecipe] = useState<SavedRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_recipes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRecipe((data as SavedRecipe) || null);
        setLoading(false);
      });
  }, [id, user]);

  async function handleSubmit(values: RecipeFormValues) {
    if (!user) return "Please log in again.";
    const { error } = await supabase
      .from("user_recipes")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return `Couldn't update recipe: ${error.message}`;
    router.push(`/recipes/${id}`);
    return null;
  }

  if (!user || loading) return <LoadingState label="Loading recipe..." />;

  return (
    <>
      <PageHeader title="Edit Recipe" />
      <ErrorMessage message={error} />
      {recipe ? (
        <RecipeForm
          initial={recipe}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          secondaryAction={
            <Link href={`/recipes/${id}`} className="text-sm font-semibold text-gray-600 hover:text-black">
              Cancel
            </Link>
          }
        />
      ) : (
        <EmptyState
          title="Recipe not found"
          actionHref="/recipes"
          actionLabel="Back to Recipes"
        />
      )}
    </>
  );
}
