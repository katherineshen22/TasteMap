import Link from "next/link";
import Navbar from "@/components/Navbar";
import { dishes } from "@/data/sampleData";

export default function RankingsPage() {
  const rankedDishes = [...dishes].sort((a, b) => b.rating - a.rating);

  return (
    <main className="min-h-screen bg-yellow-50 p-8">
        <Navbar />
      <h1 className="text-4xl font-bold mb-2 text-gray-900">Dish Rankings</h1>

      <p className="text-gray-700 mb-4">
        Your favorite restaurant dishes, ranked by rating.
      </p>

      <Link href="/" className="inline-block mb-6 text-gray-700 underline">
        ← Back to Home
      </Link>

      <div className="grid gap-4 max-w-3xl">
        {rankedDishes.map((dish, index) => (
          <div key={dish.id} className="bg-white rounded-xl p-4 shadow">
            <p className="text-sm text-gray-500">#{index + 1}</p>
            <h2 className="text-xl font-semibold text-gray-900">{dish.dish}</h2>
            <p className="text-gray-600">{dish.restaurant}</p>
            <p className="font-medium text-gray-800">Rating: {dish.rating}/10</p>
            <p className="text-sm text-gray-500">{dish.tags.join(", ")}</p>
          </div>
        ))}
      </div>
    </main>
  );
}