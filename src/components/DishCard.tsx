import Link from "next/link";
import { Dish } from "@/types/food";
import { RatingBadge, TagPill } from "@/components/ui";
import { formatLocation, formatPrice } from "@/lib/formatters";

export default function DishCard({
  dish,
  rank,
  showNotes = false,
}: {
  dish: Dish;
  rank?: number;
  showNotes?: boolean;
}) {
  const location = formatLocation(dish);

  return (
    <Link
      href={`/dishes/${dish.id}`}
      className="group flex gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {rank !== undefined && (
        <span className="w-8 shrink-0 pt-1 text-lg font-black text-gray-300">
          #{rank}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-900 group-hover:underline">
              {dish.dish}
            </h3>
            <p className="truncate text-sm text-gray-600">
              {[dish.restaurant, dish.cuisine, formatPrice(dish.price_level)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {location && (
              <p className="truncate text-xs text-gray-500">📍 {location}</p>
            )}
          </div>
          <RatingBadge rating={dish.rating} />
        </div>

        {dish.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {dish.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}

        {showNotes && dish.notes && (
          <p className="mt-3 line-clamp-2 text-sm text-gray-600">
            {dish.notes}
          </p>
        )}
      </div>
    </Link>
  );
}
