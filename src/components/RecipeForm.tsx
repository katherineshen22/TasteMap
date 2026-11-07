"use client";

import { useEffect, useState } from "react";
import { ErrorMessage, inputClass, primaryButtonClass } from "@/components/ui";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { normalizeCuisine, normalizeTags, safeHttpUrl } from "@/lib/formatters";
import { deleteDishPhoto, uploadDishPhoto } from "@/lib/photos";
import { supabase } from "@/lib/supabaseClient";
import { SavedRecipe } from "@/types/food";

export type RecipeFormValues = Omit<SavedRecipe, "id" | "user_id" | "created_at">;

type RecipeFormProps = {
  initial?: Partial<RecipeFormValues>;
  submitLabel: string;
  onSubmit: (values: RecipeFormValues) => Promise<string | null>;
  secondaryAction?: React.ReactNode;
};

const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function RecipeForm({
  initial = {},
  submitLabel,
  onSubmit,
  secondaryAction,
}: RecipeFormProps) {
  const [title, setTitle] = useState(initial.title || "");
  const [cuisine, setCuisine] = useState(initial.cuisine || "");
  const [minutes, setMinutes] = useState(
    initial.total_minutes ? String(initial.total_minutes) : ""
  );
  const [servings, setServings] = useState(initial.servings || "");
  const [ingredients, setIngredients] = useState(
    (initial.ingredients || []).join("\n")
  );
  const [instructions, setInstructions] = useState(
    (initial.instructions || []).join("\n")
  );
  const [tags, setTags] = useState((initial.tags || []).join(", "));
  const [notes, setNotes] = useState(initial.notes || "");
  const [rating, setRating] = useState(
    initial.rating != null ? String(initial.rating) : ""
  );
  const [sourceUrl, setSourceUrl] = useState(initial.source_url || "");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const existingUpload = usePhotoUrls([initial.photo_path])[initial.photo_path || ""];
  const shownPhoto =
    photoPreview ||
    (removePhoto ? "" : existingUpload || safeHttpUrl(initial.image_url) || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const ratingNumber = rating ? Number(rating) : null;
    if (ratingNumber !== null && !(ratingNumber >= 1 && ratingNumber <= 10)) {
      setError("Rating must be between 1 and 10 (or leave it blank).");
      return;
    }
    const minutesNumber = minutes ? Math.round(Number(minutes)) : null;
    if (minutesNumber !== null && !(minutesNumber >= 0 && minutesNumber <= 10000)) {
      setError("Cooking time should be a number of minutes.");
      return;
    }

    setSaving(true);
    setError("");

    const oldPhoto = initial.photo_path || null;
    let photoPath = removePhoto ? null : oldPhoto;
    let uploaded: string | null = null;
    if (photoFile) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in again to upload photos.");
        setSaving(false);
        return;
      }
      try {
        uploaded = await uploadDishPhoto(user.id, photoFile);
        photoPath = uploaded;
      } catch (uploadError) {
        setError((uploadError as Error).message);
        setSaving(false);
        return;
      }
    }

    const errorMessage = await onSubmit({
      title: title.trim(),
      cuisine: cuisine.trim() ? normalizeCuisine(cuisine) : null,
      total_minutes: minutesNumber,
      servings: servings.trim() || null,
      ingredients: lines(ingredients),
      instructions: lines(instructions).map((step) =>
        step.replace(/^(step\s*)?\d+[.):]\s*/i, "")
      ),
      tags: normalizeTags(tags),
      notes: notes.trim() || null,
      rating: ratingNumber,
      source_url: sourceUrl.trim() || null,
      // Removing the photo also drops an imported image.
      image_url: removePhoto ? null : initial.image_url || null,
      photo_path: photoPath,
    });

    if (errorMessage) {
      await deleteDishPhoto(uploaded);
      setError(errorMessage);
      setSaving(false);
      return;
    }
    if (oldPhoto && oldPhoto !== photoPath) await deleteDishPhoto(oldPhoto);
  }

  const label = "grid gap-1.5 font-medium text-gray-800";
  const field = `${inputClass} font-normal`;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid max-w-2xl gap-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
    >
      <label className={label}>
        Recipe name *
        <input
          className={field}
          placeholder="e.g. Mom's Dan Dan Noodles"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className={label}>
          Cuisine
          <input
            className={field}
            placeholder="e.g. Sichuan"
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
          />
        </label>
        <label className={label}>
          Total time (min)
          <input
            className={field}
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="30"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          />
        </label>
        <label className={label}>
          Servings
          <input
            className={field}
            placeholder="4"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
          />
        </label>
      </div>

      <label className={label}>
        <span>
          Ingredients{" "}
          <span className="font-normal text-gray-500">(one per line)</span>
        </span>
        <textarea
          className={`${field} min-h-40 font-mono text-sm`}
          placeholder={"200g wheat noodles\n2 tbsp chili oil\n1 tbsp Sichuan peppercorns"}
          value={ingredients}
          onChange={(event) => setIngredients(event.target.value)}
        />
      </label>

      <label className={label}>
        <span>
          Steps <span className="font-normal text-gray-500">(one per line)</span>
        </span>
        <textarea
          className={`${field} min-h-48 text-sm`}
          placeholder={"Boil the noodles until just tender.\nToast the peppercorns and grind them.\nToss everything with the sauce."}
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
        />
      </label>

      <div className="grid gap-2">
        <span className="font-medium text-gray-800">Photo</span>
        {shownPhoto ? (
          <div className="flex items-end gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed/blob/external URLs */}
            <img
              src={shownPhoto}
              alt="Recipe photo preview"
              className="h-32 w-32 rounded-xl object-cover"
            />
            <div className="flex flex-col gap-2 text-sm font-semibold">
              <label className="cursor-pointer text-gray-700 hover:text-black">
                Change photo
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setPhotoFile(file);
                  }}
                />
              </label>
              <button
                type="button"
                className="text-left text-red-600 hover:underline"
                onClick={() => {
                  setPhotoFile(null);
                  setRemovePhoto(true);
                }}
              >
                Remove photo
              </button>
            </div>
          </div>
        ) : (
          <label className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-500 transition hover:border-black hover:text-black">
            📷 Add a photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setPhotoFile(file);
                  setRemovePhoto(false);
                }
              }}
            />
          </label>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          <span>
            Tags <span className="font-normal text-gray-500">(comma separated)</span>
          </span>
          <input
            className={field}
            placeholder="spicy, noodles, weeknight"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </label>
        <label className={label}>
          <span>
            Your rating <span className="font-normal text-gray-500">(optional, 1–10)</span>
          </span>
          <input
            className={field}
            type="number"
            min="1"
            max="10"
            step="0.1"
            inputMode="decimal"
            placeholder="Haven't made it yet"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
          />
        </label>
      </div>

      <label className={label}>
        Notes
        <textarea
          className={`${field} min-h-24`}
          placeholder="Tweaks, substitutions, what to do differently next time..."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <label className={label}>
        Source link
        <input
          className={field}
          type="url"
          placeholder="https://..."
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
        />
      </label>

      <ErrorMessage message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Saving..." : submitLabel}
        </button>
        {secondaryAction}
      </div>
    </form>
  );
}
