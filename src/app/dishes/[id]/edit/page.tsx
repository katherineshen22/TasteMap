"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DishForm, { DishFormValues } from "@/components/DishForm";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import { useRequireUser } from "@/hooks/useRequireUser";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";

// Client component: the Supabase session lives in the browser, so loading
// the dish on the server returned nothing and the page always said "not found".
export default function EditDishPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useRequireUser();

  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    supabase
      .from("dishes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setDish((data as Dish) || null);
        setLoading(false);
      });
  }, [id, user]);

  async function handleSubmit(values: DishFormValues) {
    if (!user) return "Please log in again.";

    const { error } = await supabase
      .from("dishes")
      .update(values)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return `Couldn't update dish: ${error.message}`;

    router.push(`/dishes/${id}`);
    return null;
  }

  if (!user || loading) return <LoadingState label="Loading dish..." />;

  return (
    <>
      <PageHeader title="Edit Dish" description="Update the details for this dish." />
      <ErrorMessage message={error} />

      {dish ? (
        <DishForm
          initial={dish}
          submitLabel="Save Changes"
          savingLabel="Saving..."
          onSubmit={handleSubmit}
          secondaryAction={
            <Link href={`/dishes/${id}`} className="text-sm font-semibold text-gray-600 hover:text-black">
              Cancel
            </Link>
          }
        />
      ) : (
        <EmptyState
          title="Dish not found"
          description="It may have been deleted, or it belongs to a different account."
          actionHref="/rankings"
          actionLabel="Back to Rankings"
        />
      )}
    </>
  );
}
