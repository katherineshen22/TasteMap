"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import DishForm, { DishFormValues } from "@/components/DishForm";
import { LoadingState, PageHeader } from "@/components/ui";
import { useRequireUser } from "@/hooks/useRequireUser";
import { supabase } from "@/lib/supabaseClient";

export default function AddDishPage() {
  const router = useRouter();
  const user = useRequireUser();

  async function handleSubmit(values: DishFormValues) {
    if (!user) return "Please log in before adding a dish.";

    const { data, error } = await supabase
      .from("dishes")
      .insert([{ ...values, user_id: user.id }])
      .select("id")
      .single();

    if (error) return `Couldn't save dish: ${error.message}`;

    router.push(data?.id ? `/dishes/${data.id}` : "/rankings");
    return null;
  }

  if (!user) return <LoadingState label="Checking login..." />;

  return (
    <>
      <PageHeader
        title="Add a Dish"
        description="Log a restaurant dish so TasteMap can learn what you like."
      />
      <DishForm
        submitLabel="Save Dish"
        savingLabel="Saving..."
        onSubmit={handleSubmit}
        secondaryAction={
          <Link href="/rankings" className="text-sm font-semibold text-gray-600 hover:text-black">
            Cancel
          </Link>
        }
      />
    </>
  );
}
