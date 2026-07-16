import Link from "next/link";
import Navbar from "@/components/Navbar";
export default function AddDishPage() {
    return (
      <main className="min-h-screen bg-yellow-50 p-8">
        <Navbar />
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Add a Dish</h1>
  
        <p className="text-gray-700 mb-8">
          Log a restaurant dish so TasteMap can learn what you like.
        </p>

        <Link href="/" 
            className="inline-block mb-6 text-gray-700 underline"
        >
        ← Back to Home
        </Link>
  

        <form className="bg-white rounded-xl p-6 shadow max-w-xl grid gap-4">
          <label className="grid gap-1 text-gray-800 font-medium">
            Restaurant
            <input
              className="border rounded-lg p-2 font-normal"
              placeholder="Terakawa Ramen"
            />
          </label>
  
          <label className="grid gap-1 text-gray-800 font-medium">
            Dish
            <input
              className="border rounded-lg p-2 font-normal"
              placeholder="Spicy Miso Ramen"
            />
          </label>
  
          <label className="grid gap-1 text-gray-800 font-medium">
            Cuisine
            <input
              className="border rounded-lg p-2 font-normal"
              placeholder="Japanese"
            />
          </label>
  
          <label className="grid gap-1 text-gray-800 font-medium">
            Rating
            <input
              className="border rounded-lg p-2 font-normal"
              type="number"
              min="1"
              max="10"
              step="0.1"
              placeholder="9.1"
            />
          </label>
  
          <label className="grid gap-1 text-gray-800 font-medium">
            Tags
            <input
              className="border rounded-lg p-2 font-normal"
              placeholder="spicy, savory, noodle-based"
            />
          </label>
  
          <label className="grid gap-1 text-gray-800 font-medium">
            Notes
            <textarea
              className="border rounded-lg p-2 font-normal"
              placeholder="What did you like about it?"
            />
          </label>
  
          <button className="bg-black text-white rounded-lg p-3 font-semibold">
            Save Dish
          </button>
        </form>
      </main>
    );
  }