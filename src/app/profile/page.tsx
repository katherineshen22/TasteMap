"use client";

import Link from "next/link";
import AITasteSummary from "@/components/AITasteSummary";
import AIRestaurantIdeas from "@/components/AIRestaurantIdeas";
import StatCards from "@/components/StatCards";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
  LoginPrompt,
  PageHeader,
} from "@/components/ui";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useUserDishes } from "@/hooks/useUserDishes";

export default function ProfilePage() {
  const { status, user, dishes, error } = useUserDishes();
  const { profile } = useMyProfile();

  return (
    <>
      <PageHeader
        title="Your Taste Profile"
        description={
          user?.email
            ? `Signed in as ${user.email}`
            : "A summary of the dishes you've saved."
        }
        action={
          status === "ready" && (
            <Link
              href={profile ? `/u/${profile.username}` : "/settings/profile"}
              className="text-sm font-semibold text-gray-600 hover:text-black"
            >
              {profile ? `@${profile.username} · public profile →` : "Set up your social profile →"}
            </Link>
          )
        }
      />

      {status === "loading" && <LoadingState label="Loading profile..." />}
      <ErrorMessage message={error} />

      {status === "logged-out" && (
        <LoginPrompt reason="Log in to see your personal taste profile." />
      )}

      {status === "ready" && dishes.length === 0 && !error && (
        <EmptyState
          title="Nothing to analyze yet"
          description="Add your first dish so TasteMap can build your profile."
          actionHref="/add"
          actionLabel="Add a Dish"
        />
      )}

      {status === "ready" && dishes.length > 0 && (
        <>
          <StatCards dishes={dishes} />
          <div className="grid gap-6">
            <AITasteSummary dishes={dishes} />
            <AIRestaurantIdeas dishes={dishes} />
          </div>
        </>
      )}
    </>
  );
}
