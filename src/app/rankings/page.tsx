import Navbar from "@/components/Navbar";
import SearchableRankings from "@/components/SearchableRankings";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";

export default async function RankingsPage() {
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .order("rating", { ascending: false });

  const dishes = (data || []) as Dish[];

  return (
    <main className="min-h-screen bg-[#faf7ef] p-8">
      <Navbar />

      <h1 className="mb-2 text-4xl font-bold text-gray-900">Dish Rankings</h1>

      <p className="mb-8 text-gray-700">
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
        <SearchableRankings dishes={dishes} />
      )}
    </main>
  );
}