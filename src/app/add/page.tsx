"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import TagSelector from "@/components/TagSelector";
import { supabase } from "@/lib/supabaseClient";
import { normalizeCuisine } from "@/lib/formatters";

export default function AddDishPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const [restaurant, setRestaurant] = useState("");
  const [dish, setDish] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [rating, setRating] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setCheckingUser(false);
    }

    checkUser();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      alert("Please log in before adding a dish.");
      router.push("/login");
      return;
    }

    setSaving(true);

    const newDish = {
      restaurant: restaurant.trim(),
      dish: dish.trim(),
      cuisine: normalizeCuisine(cuisine),
      rating: Number(rating),
      tags: selectedTags,
      notes: notes.trim(),
      user_id: userId,
    };

    const { error } = await supabase.from("dishes").insert([newDish]);

    if (error) {
      setSaving(false);
      alert(`Error saving dish: ${error.message}`);
      return;
    }

    setRestaurant("");
    setDish("");
    setCuisine("");
    setRating("");
    setSelectedTags([]);
    setNotes("");
    setSaving(false);

    router.push("/rankings");
    router.refresh();
  }

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-[#faf7ef] p-8">
        <Navbar />
        <p className="text-gray-700">Checking login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7ef] p-8">
      <Navbar />

      <h1 className="mb-2 text-4xl font-bold text-gray-900">Add a Dish</h1>

      <p className="mb-8 text-gray-700">
        Log a restaurant dish so TasteMap can learn what you like.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid max-w-2xl gap-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
      >
        <label className="grid gap-1 font-medium text-gray-800">
          Restaurant
          <input
            className="rounded-xl border border-gray-300 bg-white p-3 font-normal text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
            placeholder="Terakawa Ramen"
            value={restaurant}
            onChange={(event) => setRestaurant(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 font-medium text-gray-800">
          Dish
          <input
            className="rounded-xl border border-gray-300 bg-white p-3 font-normal text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
            placeholder="Spicy Miso Ramen"
            value={dish}
            onChange={(event) => setDish(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 font-medium text-gray-800">
          Cuisine
          <input
            className="rounded-xl border border-gray-300 bg-white p-3 font-normal text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
            placeholder="Japanese"
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
          />
        </label>

        <label className="grid gap-1 font-medium text-gray-800">
          Rating
          <input
            className="rounded-xl border border-gray-300 bg-white p-3 font-normal text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
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

        <TagSelector
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />

        <label className="grid gap-1 font-medium text-gray-800">
          Notes
          <textarea
            className="rounded-xl border border-gray-300 bg-white p-3 font-normal text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
            placeholder="What did you like about it?"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <button className="rounded-full bg-black p-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:opacity-80">
          {saving ? "Saving..." : "Save Dish"}
        </button>
      </form>
    </main>
  );
}