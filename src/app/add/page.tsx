"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Dish } from "@/types/food";
import { supabase } from "@/lib/supabaseClient";

export default function AddDishPage() {
  const [savedDishes, setSavedDishes] = useState<Dish[]>([]);

  const [restaurant, setRestaurant] = useState("");
  const [dish, setDish] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [rating, setRating] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    const newDish = {
      restaurant,
      dish,
      cuisine,
      rating: Number(rating),
      tags: tags.split(",").map((tag) => tag.trim()),
      notes,
    };
  
    const { data, error } = await supabase
      .from("dishes")
      .insert([newDish])
      .select();
  
    if (error) {
        console.error("Error saving dish:", error);
        alert(`Error saving dish: ${error.message}`);
        return;
    }
  
    if (data) {
      setSavedDishes([data[0], ...savedDishes]);
    }
  
    setRestaurant("");
    setDish("");
    setCuisine("");
    setRating("");
    setTags("");
    setNotes("");
  }

  return (
    <main className="min-h-screen bg-yellow-50 p-8">
      <Navbar />

      <h1 className="text-4xl font-bold mb-2 text-gray-900">Add a Dish</h1>

      <p className="text-gray-700 mb-8">
        Log a restaurant dish so TasteMap can learn what you like.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 shadow max-w-xl grid gap-4 mb-8"
      >
        <label className="grid gap-1 text-gray-800 font-medium">
          Restaurant
          <input
            className="border rounded-lg p-2 font-normal"
            placeholder="Terakawa Ramen"
            value={restaurant}
            onChange={(event) => setRestaurant(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 text-gray-800 font-medium">
          Dish
          <input
            className="border rounded-lg p-2 font-normal"
            placeholder="Spicy Miso Ramen"
            value={dish}
            onChange={(event) => setDish(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 text-gray-800 font-medium">
          Cuisine
          <input
            className="border rounded-lg p-2 font-normal"
            placeholder="Japanese"
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
            placeholder="9.1"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 text-gray-800 font-medium">
          Tags
          <input
            className="border rounded-lg p-2 font-normal"
            placeholder="spicy, savory, noodle-based"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-gray-800 font-medium">
          Notes
          <textarea
            className="border rounded-lg p-2 font-normal"
            placeholder="What did you like about it?"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <button className="bg-black text-white rounded-lg p-3 font-semibold">
          Save Dish
        </button>
      </form>

      <section className="max-w-xl">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">
          Dishes added this session
        </h2>

        {savedDishes.length === 0 ? (
          <p className="text-gray-700">No dishes added yet.</p>
        ) : (
          <div className="grid gap-4">
            {savedDishes.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow">
                <h3 className="text-xl font-semibold text-gray-900">
                  {item.dish}
                </h3>
                <p className="text-gray-600">{item.restaurant}</p>
                <p className="font-medium text-gray-800">
                  Rating: {item.rating}/10
                </p>
                <p className="text-sm text-gray-500">
                  {item.tags.join(", ")}
                </p>
                <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}