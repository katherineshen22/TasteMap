import { Dish } from "@/types/food";
import { getTasteStats } from "@/lib/tasteStats";

export default function StatCards({ dishes }: { dishes: Dish[] }) {
  const stats = getTasteStats(dishes);

  const items = [
    { label: "Dishes logged", value: String(stats.totalDishes) },
    {
      label: "Average rating",
      value: stats.averageRating !== null ? stats.averageRating.toFixed(1) : "—",
    },
    { label: "Favorite cuisine", value: stats.favoriteCuisine || "—" },
    { label: "Top flavor", value: stats.topTag || "—" },
  ];

  return (
    <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {item.label}
          </p>
          <p className="mt-2 truncate text-2xl font-black text-gray-900">
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}
