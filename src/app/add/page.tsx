"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DishForm, { DishFormValues } from "@/components/DishForm";
import { LoadingState, PageHeader } from "@/components/ui";
import { useRequireUser } from "@/hooks/useRequireUser";
import { supabase } from "@/lib/supabaseClient";

function AddDish() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useRequireUser();
  const startAsWantToTry = params.get("list") === "want";

  async function handleSubmit(values: DishFormValues) {
    if (!user) return "Please log in before adding a dish.";

    const { data, error } = await supabase
      .from("dishes")
      .insert([{ ...values, user_id: user.id }])
      .select("id")
      .single();

    if (error) return `Couldn't save: ${error.message}`;

    if (values.status === "want_to_try") {
      router.push("/want-to-try");
    } else {
      router.push(data?.id ? `/dishes/${data.id}` : "/rankings");
    }
    return null;
  }

  if (!user) return <LoadingState label="Checking login..." />;

  return (
    <>
      <PageHeader
        title={startAsWantToTry ? "Add to Want to Try" : "Add a Dish"}
        description="Log a dish you've had, or save a place you want to try."
      />
      <DishForm
        initial={{
          status: startAsWantToTry ? "want_to_try" : "tried",
          restaurant: params.get("restaurant") || "",
        }}
        submitLabel="Save"
        savingLabel="Saving..."
        onSubmit={handleSubmit}
        secondaryAction={
          <Link
            href={startAsWantToTry ? "/want-to-try" : "/rankings"}
            className="text-sm font-semibold text-gray-600 hover:text-black"
          >
            Cancel
          </Link>
        }
      />
    </>
  );
}

export default function AddDishPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AddDish />
    </Suspense>
  );
}
