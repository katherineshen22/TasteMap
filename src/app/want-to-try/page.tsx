"use client";

import { useState } from "react";
import Link from "next/link";
import DishCard from "@/components/DishCard";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
  LoginPrompt,
  PageHeader,
  inputClass,
  primaryButtonClass,
} from "@/components/ui";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { useUserDishes } from "@/hooks/useUserDishes";
import { googleMapsUrl, uniqueSorted } from "@/lib/formatters";

export default function WantToTryPage() {
  const { status, wantToTry, error } = useUserDishes();
  const photoUrls = usePhotoUrls(wantToTry.map((d) => d.photo_path));
  const [city, setCity] = useState("");

  const cityOptions = uniqueSorted(wantToTry.map((d) => d.city));
  const shown = city
    ? wantToTry.filter((d) => d.city?.toLowerCase() === city.toLowerCase())
    : wantToTry;

  return (
    <>
      <PageHeader
        title="Want to Try"
        description="Dishes and restaurants you're saving for later."
        action={
          status === "ready" && (
            <Link href="/add?list=want" className={primaryButtonClass}>
              + Add Place
            </Link>
          )
        }
      />

      {status === "loading" && <LoadingState />}
      <ErrorMessage message={error} />

      {status === "logged-out" && (
        <LoginPrompt reason="Log in to keep a list of places you want to try." />
      )}

      {status === "ready" && wantToTry.length === 0 && !error && (
        <EmptyState
          title="Your list is empty"
          description="Heard about a great dish or a new restaurant? Save it here so you don't forget."
          actionHref="/add?list=want"
          actionLabel="Add Something to Try"
        />
      )}

      {status === "ready" && wantToTry.length > 0 && (
        <>
          {cityOptions.length > 1 && (
            <select
              className={`${inputClass} mb-6 max-w-xs py-2.5 text-sm`}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              aria-label="Filter by city"
            >
              <option value="">📍 All cities ({wantToTry.length})</option>
              {cityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          <div className="grid gap-4">
            {shown.map((dish) => (
              <div key={dish.id} className="grid gap-2">
                <DishCard
                  dish={dish}
                  showNotes
                  photoUrl={dish.photo_path ? photoUrls[dish.photo_path] : undefined}
                />
                <div className="flex flex-wrap gap-4 px-2 text-sm font-semibold">
                  <Link
                    href={`/dishes/${dish.id}/edit?tried=1`}
                    className="text-black hover:underline"
                  >
                    ✓ Mark as tried
                  </Link>
                  <a
                    href={googleMapsUrl(dish)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-black hover:underline"
                  >
                    Open in Maps ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
