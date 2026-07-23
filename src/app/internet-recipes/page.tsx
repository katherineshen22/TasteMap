import Navbar from "@/components/Navbar";
import InternetRecipeSearch from "@/components/InternetRecipeSearch";

export default function InternetRecipesPage() {
  return (
    <main className="min-h-screen bg-yellow-50 p-8">
      <Navbar />

      <h1 className="mb-2 text-4xl font-bold text-gray-900">
        Internet Recipe Search
      </h1>

      <p className="mb-8 text-gray-700">
        Search for recipes online using cuisine, tags, and cooking time.
      </p>

      <InternetRecipeSearch />
    </main>
  );
}