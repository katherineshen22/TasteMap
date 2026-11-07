"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RecipeForm, { RecipeFormValues } from "@/components/RecipeForm";
import {
  ErrorMessage,
  LoadingState,
  PageHeader,
  inputClass,
  primaryButtonClass,
} from "@/components/ui";
import { useRequireUser } from "@/hooks/useRequireUser";
import { fetchJson } from "@/lib/fetchJson";
import { supabase } from "@/lib/supabaseClient";
import { ImportedRecipe } from "@/types/food";

function NewRecipe() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useRequireUser();

  const [url, setUrl] = useState(params.get("url") || "");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [imported, setImported] = useState<ImportedRecipe | null>(null);
  // Bumped after each import so the form remounts with the new values.
  const [formKey, setFormKey] = useState(0);
  const autoImported = useRef(false);

  async function importFromUrl(link = url) {
    if (!link.trim() || importing) return;
    setImporting(true);
    setImportError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await fetchJson<{ recipe: ImportedRecipe }>(
      "/api/recipes/import",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ url: link }),
      }
    );

    setImporting(false);
    if (error || !data?.recipe) {
      setImportError(error || "Couldn't import that recipe.");
      return;
    }
    setImported(data.recipe);
    setFormKey((key) => key + 1);
  }

  // Coming from "Save" on a search result: import that link right away.
  useEffect(() => {
    const link = params.get("url");
    if (user && link && !autoImported.current) {
      autoImported.current = true;
      importFromUrl(link);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(values: RecipeFormValues) {
    if (!user) return "Please log in first.";
    const { data, error } = await supabase
      .from("user_recipes")
      .insert([{ ...values, user_id: user.id }])
      .select("id")
      .single();
    if (error) return `Couldn't save recipe: ${error.message}`;
    router.push(`/recipes/${data.id}`);
    return null;
  }

  if (!user) return <LoadingState label="Checking login..." />;

  return (
    <>
      <PageHeader
        title="Add a Recipe"
        description="Import one from a link, or write down your own."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          importFromUrl();
        }}
        className="mb-8 grid max-w-2xl gap-3 rounded-2xl border border-black/10 bg-[#faf7ef] p-5"
      >
        <label htmlFor="import-url" className="font-bold text-gray-900">
          🔗 Import from a link
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="import-url"
            type="url"
            className={inputClass}
            placeholder="Paste a recipe URL (NYT Cooking, AllRecipes, a blog...)"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button
            type="submit"
            disabled={importing || !url.trim()}
            className={`${primaryButtonClass} shrink-0`}
          >
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
        <ErrorMessage message={importError} />
        {imported && !importing && (
          <p className="text-sm text-green-800">
            ✓ Imported “{imported.title}”. Check the details below, then save.
          </p>
        )}
      </form>

      <h2 className="mb-4 text-xl font-black text-black">
        {imported ? "Review & save" : "…or write your own"}
      </h2>
      <RecipeForm
        key={formKey}
        initial={imported ?? {}}
        submitLabel="Save Recipe"
        onSubmit={handleSubmit}
        secondaryAction={
          <Link href="/recipes" className="text-sm font-semibold text-gray-600 hover:text-black">
            Cancel
          </Link>
        }
      />
    </>
  );
}

export default function NewRecipePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NewRecipe />
    </Suspense>
  );
}
