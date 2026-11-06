"use client";

import Link from "next/link";
import SearchableRankings from "@/components/SearchableRankings";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
  LoginPrompt,
  PageHeader,
  primaryButtonClass,
} from "@/components/ui";
import { useUserDishes } from "@/hooks/useUserDishes";

export default function RankingsPage() {
  const { status, dishes, error } = useUserDishes();

  return (
    <>
      <PageHeader
        title="Dish Rankings"
        description="Every dish you've logged, ranked by rating."
        action={
          status === "ready" && (
            <Link href="/add" className={primaryButtonClass}>
              + Add Dish
            </Link>
          )
        }
      />

      {status === "loading" && <LoadingState />}
      <ErrorMessage message={error} />

      {status === "logged-out" && (
        <LoginPrompt reason="Log in to see your personal dish rankings." />
      )}

      {status === "ready" && dishes.length === 0 && !error && (
        <EmptyState
          title="No dishes yet"
          description="Add your first dish to start building your rankings."
          actionHref="/add"
          actionLabel="Add a Dish"
        />
      )}

      {status === "ready" && dishes.length > 0 && (
        <SearchableRankings dishes={dishes} />
      )}
    </>
  );
}
