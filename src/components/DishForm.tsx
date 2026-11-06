"use client";

import { useState } from "react";
import TagSelector from "@/components/TagSelector";
import { ErrorMessage, inputClass, primaryButtonClass } from "@/components/ui";
import { normalizeCuisine } from "@/lib/formatters";
import { Dish } from "@/types/food";

export type DishFormValues = Pick<
  Dish,
  "restaurant" | "dish" | "cuisine" | "rating" | "tags" | "notes"
>;

type DishFormProps = {
  initial?: Partial<DishFormValues>;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (values: DishFormValues) => Promise<string | null>;
  secondaryAction?: React.ReactNode;
};

const cuisineSuggestions = [
  "American", "Chinese", "French", "Greek", "Indian", "Italian", "Japanese",
  "Korean", "Mediterranean", "Mexican", "Middle Eastern", "Thai", "Vietnamese",
];

export default function DishForm({
  initial = {},
  submitLabel,
  savingLabel,
  onSubmit,
  secondaryAction,
}: DishFormProps) {
  const [restaurant, setRestaurant] = useState(initial.restaurant || "");
  const [dish, setDish] = useState(initial.dish || "");
  const [cuisine, setCuisine] = useState(initial.cuisine || "");
  const [rating, setRating] = useState(
    initial.rating !== undefined ? String(initial.rating) : "8"
  );
  const [tags, setTags] = useState<string[]>(initial.tags || []);
  const [notes, setNotes] = useState(initial.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ratingNumber = Number(rating);
  const ratingValid =
    rating !== "" && ratingNumber >= 1 && ratingNumber <= 10;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (!ratingValid) {
      setError("Rating must be a number between 1 and 10.");
      return;
    }

    setSaving(true);
    setError("");

    const errorMessage = await onSubmit({
      restaurant: restaurant.trim(),
      dish: dish.trim(),
      cuisine: normalizeCuisine(cuisine),
      rating: Math.round(ratingNumber * 10) / 10,
      tags,
      notes: notes.trim(),
    });

    if (errorMessage) {
      setError(errorMessage);
      setSaving(false);
    }
    // On success the parent navigates away, so keep the button disabled.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid max-w-2xl gap-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5 font-medium text-gray-800">
          Dish name *
          <input
            className={`${inputClass} font-normal`}
            placeholder="e.g. Spicy Miso Ramen"
            value={dish}
            onChange={(event) => setDish(event.target.value)}
            required
            autoFocus
          />
        </label>

        <label className="grid gap-1.5 font-medium text-gray-800">
          Restaurant *
          <input
            className={`${inputClass} font-normal`}
            placeholder="e.g. Terakawa Ramen"
            value={restaurant}
            onChange={(event) => setRestaurant(event.target.value)}
            required
          />
        </label>
      </div>

      <label className="grid gap-1.5 font-medium text-gray-800">
        Cuisine
        <input
          className={`${inputClass} font-normal`}
          placeholder="e.g. Japanese"
          list="cuisine-suggestions"
          value={cuisine}
          onChange={(event) => setCuisine(event.target.value)}
        />
        <datalist id="cuisine-suggestions">
          {cuisineSuggestions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </label>

      <div className="grid gap-2">
        <label htmlFor="rating" className="font-medium text-gray-800">
          Rating *
        </label>
        <div className="flex items-center gap-4">
          <input
            id="rating-slider"
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={ratingValid ? rating : "1"}
            onChange={(event) => setRating(event.target.value)}
            className="flex-1 accent-black"
            aria-label="Rating slider"
          />
          <input
            id="rating"
            className={`${inputClass} w-24 text-center font-bold`}
            type="number"
            inputMode="decimal"
            min="1"
            max="10"
            step="0.1"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            required
          />
        </div>
        <p className="text-sm text-gray-500">
          1 = never again · 5 = fine · 8+ = would order again · 10 = perfect
        </p>
      </div>

      <TagSelector selectedTags={tags} setSelectedTags={setTags} />

      <label className="grid gap-1.5 font-medium text-gray-800">
        Notes
        <textarea
          className={`${inputClass} min-h-24 font-normal`}
          placeholder="What did you like about it? Would you order it again?"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <ErrorMessage message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? savingLabel : submitLabel}
        </button>
        {secondaryAction}
      </div>
    </form>
  );
}
