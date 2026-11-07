"use client";

import { useEffect, useState } from "react";
import TagSelector from "@/components/TagSelector";
import { ErrorMessage, inputClass, primaryButtonClass } from "@/components/ui";
import { normalizeCuisine, titleCase, uniqueSorted } from "@/lib/formatters";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { deleteDishPhoto, uploadDishPhoto } from "@/lib/photos";
import { supabase } from "@/lib/supabaseClient";
import { Dish, DishStatus } from "@/types/food";

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
  | "status"
  | "photo_path"
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
  // Overrides initial.status, e.g. "Mark as tried" opens the form as "tried".
  forceStatus?: DishStatus;
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
  forceStatus,
  submitLabel,
  savingLabel,
  onSubmit,
  secondaryAction,
}: DishFormProps) {
  const [status, setStatus] = useState<DishStatus>(
    forceStatus || initial.status || "tried"
  );
  const wantToTry = status === "want_to_try";
  const [restaurant, setRestaurant] = useState(initial.restaurant || "");
  const [dish, setDish] = useState(initial.dish || "");
  const [cuisine, setCuisine] = useState(initial.cuisine || "");
  const [rating, setRating] = useState(
    initial.rating != null ? String(initial.rating) : "8"
  );

  // Photo: a newly picked file, or whether to remove the existing one.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const existingPhotoUrl = usePhotoUrls([initial.photo_path])[
    initial.photo_path || ""
  ];
  const shownPhoto =
    photoPreview || (!removePhoto && initial.photo_path ? existingPhotoUrl : "");

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);
  const [tags, setTags] = useState<string[]>(initial.tags || []);
  const [notes, setNotes] = useState(initial.notes || "");
  const [city, setCity] = useState(initial.city || "");
  const [neighborhood, setNeighborhood] = useState(initial.neighborhood || "");
  const [priceLevel, setPriceLevel] = useState<number | null>(
    initial.price_level ?? null
  );
  // New dishes (and wishlist items being marked as tried) default to today;
  // existing tried dishes keep whatever they had, even if blank.
  const [visitedOn, setVisitedOn] = useState(
    initial.visited_on ||
      ("visited_on" in initial && initial.status !== "want_to_try"
        ? ""
        : todayLocal())
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // The user's past dishes power autocomplete and restaurant autofill.
  const [pastDishes, setPastDishes] = useState<Dish[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("dishes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled || !data) return;
      setPastDishes(data as Dish[]);

      // Opened from "Add dish here": fill in what we know about the place.
      const preset = initial.restaurant?.trim().toLowerCase();
      const match =
        preset &&
        !initial.dish &&
        (data as Dish[]).find((d) => d.restaurant.trim().toLowerCase() === preset);
      if (match) {
        setCuisine((value) => value || match.cuisine || "");
        setCity((value) => value || match.city || "");
        setNeighborhood((value) => value || match.neighborhood || "");
        setPriceLevel((value) => value ?? match.price_level ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
    // Runs once on mount; `initial` is only the starting values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (!wantToTry && !ratingValid) {
      setError("Rating must be a number between 1 and 10.");
      return;
    }
    if (!wantToTry && !dish.trim()) {
      setError("Add the name of the dish you tried.");
      return;
    }

    setSaving(true);
    setError("");

    // Upload a new photo first so its path can be saved with the dish.
    const oldPhoto = initial.photo_path || null;
    let photoPath = removePhoto ? null : oldPhoto;
    let uploadedPath: string | null = null;
    if (photoFile) {
      if (!userId) {
        setError("Please log in again to upload photos.");
        setSaving(false);
        return;
      }
      try {
        uploadedPath = await uploadDishPhoto(userId, photoFile);
        photoPath = uploadedPath;
      } catch (uploadError) {
        setError((uploadError as Error).message);
        setSaving(false);
        return;
      }
    }

    const errorMessage = await onSubmit({
      status,
      restaurant: restaurant.trim(),
      dish: dish.trim(),
      cuisine: normalizeCuisine(cuisine),
      rating: wantToTry ? null : Math.round(ratingNumber * 10) / 10,
      tags,
      notes: notes.trim(),
      city: city.trim() ? titleCase(city) : null,
      neighborhood: neighborhood.trim() ? titleCase(neighborhood) : null,
      price_level: priceLevel,
      visited_on: wantToTry ? null : visitedOn || null,
      photo_path: photoPath,
    });

    if (errorMessage) {
      // Don't leave an orphaned upload behind if the dish didn't save.
      await deleteDishPhoto(uploadedPath);
      setError(errorMessage);
      setSaving(false);
      return;
    }

    // Saved: clean up the photo that was replaced or removed.
    if (oldPhoto && oldPhoto !== photoPath) await deleteDishPhoto(oldPhoto);
    // On success the parent navigates away, so keep the button disabled.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid max-w-2xl gap-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
    >
      <div
        className="grid grid-cols-2 rounded-full border border-black/10 p-1 text-sm font-semibold"
        role="radiogroup"
        aria-label="Have you tried it?"
      >
        {(
          [
            ["tried", "✓ I've tried it"],
            ["want_to_try", "☆ Want to try"],
          ] as [DishStatus, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={status === value}
            onClick={() => setStatus(value)}
            className={
              status === value
                ? "rounded-full bg-black px-4 py-2 text-white"
                : "rounded-full px-4 py-2 text-gray-600 hover:text-black"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5 font-medium text-gray-800">
          {wantToTry ? (
            <span>
              Dish <span className="font-normal text-gray-500">(optional)</span>
            </span>
          ) : (
            "Dish name *"
          )}
          <input
            className={`${inputClass} font-normal`}
            placeholder={wantToTry ? "Leave blank for the whole menu" : "e.g. Spicy Miso Ramen"}
            value={dish}
            onChange={(event) => setDish(event.target.value)}
            required={!wantToTry}
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

        {!wantToTry && (
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
        )}
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

      {!wantToTry && (
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
      )}

      <TagSelector selectedTags={tags} setSelectedTags={setTags} />

      <div className="grid gap-2">
        <span className="font-medium text-gray-800">Photo</span>
        {shownPhoto ? (
          <div className="flex items-end gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed/blob URLs */}
            <img
              src={shownPhoto}
              alt="Dish photo preview"
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

      <label className="grid gap-1.5 font-medium text-gray-800">
        {wantToTry ? "Why do you want to try it?" : "Notes"}
        <textarea
          className={`${inputClass} min-h-24 font-normal`}
          placeholder={
            wantToTry
              ? "e.g. Friend recommended the tonkotsu, saw it on TikTok..."
              : "What did you like about it? Would you order it again?"
          }
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
