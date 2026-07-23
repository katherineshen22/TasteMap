"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type DeleteDishButtonProps = {
  dishId: number;
};

export default function DeleteDishButton({ dishId }: DeleteDishButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this dish?"
    );

    if (!confirmed) return;

    const { error } = await supabase.from("dishes").delete().eq("id", dishId);

    if (error) {
      alert(`Error deleting dish: ${error.message}`);
      return;
    }

    router.push("/rankings");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
    >
      Delete Dish
    </button>
  );
}