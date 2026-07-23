import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="mb-8 flex flex-wrap gap-3">
      <Link
        href="/"
        className="rounded-lg bg-black px-4 py-2 font-semibold text-white"
      >
        Home
      </Link>

      <Link
        href="/add"
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-900"
      >
        Add Dish
      </Link>

      <Link
        href="/rankings"
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-900"
      >
        Rankings
      </Link>

      <Link
        href="/recipes"
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-900"
      >
        Recipes
      </Link>

      <Link
        href="/profile"
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-900"
      >
        Profile
      </Link>

      <Link
        href="/internet-recipes"
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-900"
      >
        Internet Recipes
      </Link>
    </nav>
  );
}