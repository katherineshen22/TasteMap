import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";

export default async function RankingsPage() {
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .order("rating", { ascending: false });

  const dishes = (data || []) as Dish[];

  return (
    <main className="min-h-screen bg-yellow-50 p-8">
      <Navbar />

      <h1 className="text-4xl font-bold mb-2 text-gray-900">Dish Rankings</h1>

      <p className="text-gray-700 mb-8">
        Your favorite restaurant dishes, ranked by rating.
      </p>

      {error && (
        <p className="mb-4 text-red-600">
          Error loading dishes: {error.message}
        </p>
      )}

      {dishes.length === 0 ? (
        <p className="text-gray-700">
          No dishes saved yet. Add your first dish to see rankings.
        </p>
      ) : (
        <div className="grid gap-4 max-w-3xl">
          {dishes.map((dish, index) => (
            <div key={dish.id} className="bg-white rounded-xl p-4 shadow">
              <p className="text-sm text-gray-500">#{index + 1}</p>
              <h2 className="text-xl font-semibold text-gray-900">
                {dish.dish}
              </h2>
              <p className="text-gray-600">{dish.restaurant}</p>
              <p className="font-medium text-gray-800">
                Rating: {dish.rating}/10
              </p>
              <p className="text-sm text-gray-500">
                {dish.tags?.join(", ")}
              </p>
              <p className="text-sm text-gray-600 mt-2">{dish.notes}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}