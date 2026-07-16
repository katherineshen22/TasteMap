import Navbar from "@/components/Navbar";
import { dishes } from "@/data/sampleData";

export default function ProfilePage() {
  const likedDishes = dishes.filter((dish) => dish.rating >= 8);

  const cuisineCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  likedDishes.forEach((dish) => {
    cuisineCounts[dish.cuisine] = (cuisineCounts[dish.cuisine] || 0) + 1;

    dish.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const favoriteCuisines = Object.entries(cuisineCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const favoriteTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const averageRating =
    dishes.reduce((sum, dish) => sum + dish.rating, 0) / dishes.length;

  return (
    <main className="min-h-screen bg-yellow-50 p-8">
      <Navbar />

      <h1 className="text-4xl font-bold mb-2 text-gray-900">Taste Profile</h1>

      <p className="text-gray-700 mb-8">
        A summary of the cuisines, flavors, and dishes you tend to rate highly.
      </p>

      <section className="grid gap-4 max-w-3xl mb-8">
        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="text-xl font-semibold text-gray-900">Average Rating</h2>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {averageRating.toFixed(1)}/10
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="text-xl font-semibold text-gray-900">
            Favorite Cuisines
          </h2>

          <div className="mt-3 grid gap-2">
            {favoriteCuisines.map(([cuisine, count]) => (
              <p key={cuisine} className="text-gray-700">
                {cuisine}: {count} highly rated dish{count > 1 ? "es" : ""}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="text-xl font-semibold text-gray-900">
            Favorite Flavor Tags
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {favoriteTags.map(([tag, count]) => (
              <span
                key={tag}
                className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-gray-800"
              >
                {tag} × {count}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}