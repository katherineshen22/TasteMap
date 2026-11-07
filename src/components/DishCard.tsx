import Link from "next/link";
import { Dish } from "@/types/food";
import { RatingBadge, TagPill } from "@/components/ui";
import { formatLocation, formatPrice } from "@/lib/formatters";

export default function DishCard({
  dish,
  rank,
  showNotes = false,
  photoUrl,
}: {
  dish: Dish;
  rank?: number;
  showNotes?: boolean;
  photoUrl?: string;
}) {
  const location = formatLocation(dish);
  const wantToTry = dish.status === "want_to_try";
  // Wishlist items may be a whole restaurant rather than one dish.
  const title = dish.dish || dish.restaurant;
  const subtitle = [
    dish.dish ? dish.restaurant : "",
    dish.cuisine,
    formatPrice(dish.price_level),
  ]
    .filter(Boolean)
    .join(" · ");

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

      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire, so skip next/image caching
        <img
          src={photoUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-900 group-hover:underline">
              {title}
            </h3>
            {subtitle && (
              <p className="truncate text-sm text-gray-600">{subtitle}</p>
            )}
            {location && (
              <p className="truncate text-xs text-gray-500">📍 {location}</p>
            )}
          </div>
          {wantToTry || dish.rating == null ? (
            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              ☆ Want to try
            </span>
          ) : (
            <RatingBadge rating={dish.rating} />
          )}
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
