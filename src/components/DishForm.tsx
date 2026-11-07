"use client";

import { useEffect, useState } from "react";
import TagSelector from "@/components/TagSelector";
import { ErrorMessage, inputClass, primaryButtonClass } from "@/components/ui";
import { normalizeCuisine, titleCase, uniqueSorted } from "@/lib/formatters";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";

export type DishFormValues = Pick<
  Dish,
  | "restaurant"
  | "dish"
  | "cuisine"
  | "rating"
  | "tags"
  | "notes"
  | "city"
  | "neighborhood"
  | "price_level"
  | "visited_on"
>;

const priceOptions = [
  { value: 1, label: "$", hint: "Under $15" },
  { value: 2, label: "$$", hint: "$15–30" },
  { value: 3, label: "$$$", hint: "$30–60" },
  { value: 4, label: "$$$$", hint: "$60+" },
];

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

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
  const [city, setCity] = useState(initial.city || "");
  const [neighborhood, setNeighborhood] = useState(initial.neighborhood || "");
  const [priceLevel, setPriceLevel] = useState<number | null>(
    initial.price_level ?? null
  );
  // New dishes default to today; existing dishes keep whatever they had.
  const [visitedOn, setVisitedOn] = useState(
    "restaurant" in initial ? initial.visited_on || "" : todayLocal()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // The user's past dishes power autocomplete and restaurant autofill.
  const [pastDishes, setPastDishes] = useState<Dish[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("dishes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled && data) setPastDishes(data as Dish[]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const restaurantOptions = uniqueSorted(pastDishes.map((d) => d.restaurant));
  const cityOptions = uniqueSorted(pastDishes.map((d) => d.city));
  const neighborhoodOptions = uniqueSorted(
    pastDishes
      .filter(
        (d) => !city.trim() || d.city?.toLowerCase() === city.trim().toLowerCase()
      )
      .map((d) => d.neighborhood)
  );

  // Picking a restaurant you've logged before fills in its details,
  // without overwriting anything you've already typed.
  function handleRestaurantChange(value: string) {
    setRestaurant(value);
    const match = pastDishes.find(
      (d) => d.restaurant.trim().toLowerCase() === value.trim().toLowerCase()
    );
    if (!match) return;
    if (!cuisine && match.cuisine) setCuisine(match.cuisine);
    if (!city && match.city) setCity(match.city);
    if (!neighborhood && match.neighborhood) setNeighborhood(match.neighborhood);
    if (priceLevel === null && match.price_level) setPriceLevel(match.price_level);
  }

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
      city: city.trim() ? titleCase(city) : null,
      neighborhood: neighborhood.trim() ? titleCase(neighborhood) : null,
      price_level: priceLevel,
      visited_on: visitedOn || null,
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
            list="restaurant-suggestions"
            value={restaurant}
            onChange={(event) => handleRestaurantChange(event.target.value)}
            required
          />
          <datalist id="restaurant-suggestions">
            {restaurantOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5 font-medium text-gray-800">
          City
          <input
            className={`${inputClass} font-normal`}
            placeholder="e.g. Philadelphia"
            list="city-suggestions"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <datalist id="city-suggestions">
            {cityOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>

        <label className="grid gap-1.5 font-medium text-gray-800">
          Neighborhood
          <input
            className={`${inputClass} font-normal`}
            placeholder="e.g. Chinatown"
            list="neighborhood-suggestions"
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
          />
          <datalist id="neighborhood-suggestions">
            {neighborhoodOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 font-medium text-gray-800">Price</legend>
          <div className="flex gap-2">
            {priceOptions.map((option) => {
              const selected = priceLevel === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.hint}
                  aria-pressed={selected}
                  onClick={() => setPriceLevel(selected ? null : option.value)}
                  className={
                    selected
                      ? "flex-1 rounded-xl border border-black bg-black py-3 text-sm font-bold text-white"
                      : "flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 transition hover:border-black"
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="grid gap-1.5 font-medium text-gray-800">
          Date visited
          <input
            type="date"
            className={`${inputClass} font-normal`}
            value={visitedOn}
            max={todayLocal()}
            onChange={(event) => setVisitedOn(event.target.value)}
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
