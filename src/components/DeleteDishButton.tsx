"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDishPhoto } from "@/lib/photos";
import { supabase } from "@/lib/supabaseClient";

export default function DeleteDishButton({
  dishId,
  photoPath,
  redirectTo = "/rankings",
}: {
  dishId: number;
  photoPath?: string | null;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!window.confirm("Delete this dish? This can't be undone.")) return;

    setDeleting(true);
    setError("");

    const { error } = await supabase.from("dishes").delete().eq("id", dishId);

    if (error) {
      setError(`Couldn't delete: ${error.message}`);
      setDeleting(false);
      return;
    }

    await deleteDishPhoto(photoPath);
    router.push(redirectTo);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex items-center justify-center rounded-full border border-red-200 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </>
  );
}
