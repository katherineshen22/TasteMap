"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DishCard from "@/components/DishCard";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { RatingBadge, inputClass, secondaryButtonClass } from "@/components/ui";
import {
  formatLocation,
  formatPrice,
  googleMapsUrl,
  uniqueSorted,
} from "@/lib/formatters";
import { Dish } from "@/types/food";

type SortKey = "rating" | "recent" | "restaurant";
type View = "dishes" | "restaurants";

const selectClass = `${inputClass} py-2.5 text-sm`;

const same = (a?: string | null, b?: string | null) =>
  (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

function dishDate(dish: Dish) {
  return dish.visited_on || dish.created_at || "";
}

function downloadCsv(dishes: Dish[]) {
  const columns: [string, (dish: Dish) => unknown][] = [
    ["Dish", (d) => d.dish],
    ["Restaurant", (d) => d.restaurant],
    ["Cuisine", (d) => d.cuisine],
    ["Rating", (d) => d.rating],
    ["Price", (d) => formatPrice(d.price_level)],
    ["Neighborhood", (d) => d.neighborhood],
    ["City", (d) => d.city],
    ["Date visited", (d) => d.visited_on],
    ["Tags", (d) => (d.tags || []).join("; ")],
    ["Notes", (d) => d.notes],
  ];
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [
    columns.map(([name]) => escape(name)).join(","),
    ...dishes.map((dish) => columns.map(([, get]) => escape(get(dish))).join(",")),
  ].join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "tastemap-dishes.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SearchableRankings({ dishes }: { dishes: Dish[] }) {
  const params = useSearchParams();
  const photoUrls = usePhotoUrls(dishes.map((d) => d.photo_path));

  const [search, setSearch] = useState("");
  const [city, setCity] = useState(params.get("city") || "");
  const [neighborhood, setNeighborhood] = useState(
    params.get("neighborhood") || ""
  );
  const [cuisine, setCuisine] = useState(params.get("cuisine") || "");
  const [tag, setTag] = useState(params.get("tag") || "");
  const [price, setPrice] = useState(params.get("price") || "");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState<SortKey>("rating");
  const [view, setView] = useState<View>(
    params.get("view") === "restaurants" ? "restaurants" : "dishes"
  );

  const cityOptions = uniqueSorted(dishes.map((d) => d.city));
  const neighborhoodOptions = uniqueSorted(
    dishes.filter((d) => !city || same(d.city, city)).map((d) => d.neighborhood)
  );
  const cuisineOptions = uniqueSorted(dishes.map((d) => d.cuisine));
  const tagOptions = uniqueSorted(dishes.flatMap((d) => d.tags || []));

  const searchText = search.trim().toLowerCase();
  const filtersActive = Boolean(
    searchText || city || neighborhood || cuisine || tag || price || minRating
  );

  // Rank is the dish's overall position by rating, so numbers stay stable
  // while filtering. (`dishes` arrives sorted by rating.)
  const filtered = useMemo(() => {
    const ranked = dishes.map((dish, index) => ({ dish, rank: index + 1 }));

    const matches = ranked.filter(({ dish }) => {
      if (city && !same(dish.city, city)) return false;
      if (neighborhood && !same(dish.neighborhood, neighborhood)) return false;
      if (cuisine && !same(dish.cuisine, cuisine)) return false;
      if (tag && !(dish.tags || []).some((t) => same(t, tag))) return false;
      if (price && dish.price_level !== Number(price)) return false;
      if (minRating && Number(dish.rating) < Number(minRating)) return false;
      if (!searchText) return true;
      return [
        dish.dish,
        dish.restaurant,
        dish.cuisine,
        dish.city,
        dish.neighborhood,
        dish.notes,
        dish.tags?.join(" "),
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(searchText));
    });

    if (sort === "recent") {
      matches.sort((a, b) => dishDate(b.dish).localeCompare(dishDate(a.dish)));
    } else if (sort === "restaurant") {
      matches.sort((a, b) => a.dish.restaurant.localeCompare(b.dish.restaurant));
    }
    return matches;
  }, [dishes, city, neighborhood, cuisine, tag, price, minRating, searchText, sort]);

  const restaurants = useMemo(() => {
    const groups = new Map<string, Dish[]>();
    for (const { dish } of filtered) {
      const key = `${dish.restaurant.trim().toLowerCase()}|${(dish.city || "").toLowerCase()}`;
      groups.set(key, [...(groups.get(key) || []), dish]);
    }
    return [...groups.values()]
      .map((group) => {
        const sorted = [...group].sort((a, b) => Number(b.rating) - Number(a.rating));
        const average =
          group.reduce((sum, d) => sum + Number(d.rating), 0) / group.length;
        return { dishes: sorted, best: sorted[0], average };
      })
      .sort((a, b) =>
        sort === "restaurant"
          ? a.best.restaurant.localeCompare(b.best.restaurant)
          : b.average - a.average
      );
  }, [filtered, sort]);

  function clearFilters() {
    setSearch("");
    setCity("");
    setNeighborhood("");
    setCuisine("");
    setTag("");
    setPrice("");
    setMinRating("");
  }

  return (
    <section>
      <div className="mb-6 grid gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <input
          type="search"
          className={inputClass}
          placeholder="Search dishes, restaurants, places, tags, or notes..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search dishes"
        />

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          <select
            className={selectClass}
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setNeighborhood("");
            }}
            aria-label="Filter by city"
          >
            <option value="">📍 All cities</option>
            {cityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
            aria-label="Filter by neighborhood"
            disabled={neighborhoodOptions.length === 0}
          >
            <option value="">All neighborhoods</option>
            {neighborhoodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
            aria-label="Filter by cuisine"
          >
            <option value="">All cuisines</option>
            {cuisineOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {tagOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            aria-label="Filter by price"
          >
            <option value="">Any price</option>
            {[1, 2, 3, 4].map((level) => (
              <option key={level} value={level}>
                {formatPrice(level)}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={minRating}
            onChange={(event) => setMinRating(event.target.value)}
            aria-label="Minimum rating"
          >
            <option value="">Any rating</option>
            <option value="9">9+ only</option>
            <option value="8">8+ (would reorder)</option>
            <option value="6.5">6.5+</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full border border-black/10 p-1 text-sm font-semibold">
            {(["dishes", "restaurants"] as View[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={
                  view === option
                    ? "rounded-full bg-black px-4 py-1.5 text-white"
                    : "rounded-full px-4 py-1.5 text-gray-600 hover:text-black"
                }
              >
                {option === "dishes" ? "Dishes" : "By restaurant"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Sort
              <select
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
              >
                <option value="rating">Highest rated</option>
                <option value="recent">Most recent</option>
                <option value="restaurant">Restaurant A–Z</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => downloadCsv(filtered.map(({ dish }) => dish))}
              disabled={filtered.length === 0}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-black hover:text-black disabled:opacity-40"
              title="Download the dishes shown as a spreadsheet"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {filtersActive && (
        <p className="mb-3 text-sm text-gray-500">
          {filtered.length} of {dishes.length} dishes ·{" "}
          <button
            type="button"
            className="font-semibold text-black underline"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-gray-600">
          No dishes match these filters.{" "}
          <button
            type="button"
            className="font-semibold text-black underline"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : view === "dishes" ? (
        <div className="grid gap-3">
          {filtered.map(({ dish, rank }) => (
            <DishCard
              key={dish.id}
              dish={dish}
              rank={sort === "rating" ? rank : undefined}
              photoUrl={dish.photo_path ? photoUrls[dish.photo_path] : undefined}
              showNotes
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {restaurants.map(({ dishes: group, best, average }) => {
            const location = formatLocation(best);
            return (
              <div
                key={`${best.restaurant}|${best.city || ""}`}
                className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-gray-900">
                      {best.restaurant}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {[
                        best.cuisine,
                        formatPrice(best.price_level),
                        `${group.length} dish${group.length === 1 ? "" : "es"}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {location && (
                      <p className="text-xs text-gray-500">📍 {location}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <RatingBadge rating={Math.round(average * 10) / 10} />
                    <p className="mt-1 text-xs text-gray-400">avg</p>
                  </div>
                </div>

                <ul className="mt-3 grid gap-1 border-t border-black/5 pt-3 text-sm">
                  {group.map((dish, index) => (
                    <li key={dish.id} className="flex justify-between gap-3">
                      <Link
                        href={`/dishes/${dish.id}`}
                        className="truncate text-gray-800 hover:underline"
                      >
                        {index === 0 && group.length > 1 ? "⭐ " : ""}
                        {dish.dish}
                      </Link>
                      <span className="shrink-0 font-semibold text-gray-600">
                        {Number(dish.rating)}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={googleMapsUrl(best)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${secondaryButtonClass} mt-4 px-4 py-2`}
                >
                  Open in Maps ↗
                </a>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
