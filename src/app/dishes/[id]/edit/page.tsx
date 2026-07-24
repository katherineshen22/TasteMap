import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";
import EditDishForm from "@/components/EditDishForm";

type EditDishPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditDishPage({ params }: EditDishPageProps) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .eq("id", id)
    .single();

  const dish = data as Dish | null;

  return (
    <main className="min-h-screen bg-[#faf7ef] p-8">
      <Navbar />

      <h1 className="text-4xl font-bold mb-2 text-gray-900">Edit Dish</h1>

      <p className="text-gray-700 mb-8">
        Update the rating, tags, or notes for this dish.
      </p>

      {error && (
        <p className="mb-4 text-red-600">
          Error loading dish: {error.message}
        </p>
      )}

      {!dish ? (
        <p className="text-gray-700">Dish not found.</p>
      ) : (
        <EditDishForm dish={dish} />
      )}
    </main>
  );
}