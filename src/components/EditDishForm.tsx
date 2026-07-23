"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";
import { normalizeCuisine, normalizeTags } from "@/lib/formatters";

type EditDishFormProps = {
  dish: Dish;
};

export default function EditDishForm({ dish }: EditDishFormProps) {
  const router = useRouter();

  const [restaurant, setRestaurant] = useState(dish.restaurant || "");
  const [dishName, setDishName] = useState(dish.dish || "");
  const [cuisine, setCuisine] = useState(dish.cuisine || "");
  const [rating, setRating] = useState(String(dish.rating || ""));
  const [tags, setTags] = useState(dish.tags?.join(", ") || "");
  const [notes, setNotes] = useState(dish.notes || "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const updatedDish = {
      restaurant,
      dish: dishName,
      cuisine: normalizeCuisine(cuisine),
      rating: Number(rating),
      tags: normalizeTags(tags),
      notes,
    };

    const { error } = await supabase
      .from("dishes")
      .update(updatedDish)
      .eq("id", dish.id);

    if (error) {
      alert(`Error updating dish: ${error.message}`);
      return;
    }

    router.push(`/dishes/${dish.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-6 shadow max-w-xl grid gap-4"
    >
      <label className="grid gap-1 text-gray-800 font-medium">
        Restaurant
        <input
          className="border rounded-lg p-2 font-normal"
          value={restaurant}
          onChange={(event) => setRestaurant(event.target.value)}
          required
        />
      </label>

      <label className="grid gap-1 text-gray-800 font-medium">
        Dish
        <input
          className="border rounded-lg p-2 font-normal"
          value={dishName}
          onChange={(event) => setDishName(event.target.value)}
          required
        />
      </label>

      <label className="grid gap-1 text-gray-800 font-medium">
        Cuisine
        <input
          className="border rounded-lg p-2 font-normal"
          value={cuisine}
          onChange={(event) => setCuisine(event.target.value)}
        />
      </label>

      <label className="grid gap-1 text-gray-800 font-medium">
        Rating
        <input
          className="border rounded-lg p-2 font-normal"
          type="number"
          min="1"
          max="10"
          step="0.1"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          required
        />
      </label>

      <label className="grid gap-1 text-gray-800 font-medium">
        Tags
        <input
          className="border rounded-lg p-2 font-normal"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </label>

      <label className="grid gap-1 text-gray-800 font-medium">
        Notes
        <textarea
          className="border rounded-lg p-2 font-normal"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <button className="bg-black text-white rounded-lg p-3 font-semibold">
        Save Changes
      </button>
    </form>
  );
}