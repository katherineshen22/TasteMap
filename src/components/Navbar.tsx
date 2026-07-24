import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/add", label: "Add Dish" },
  { href: "/rankings", label: "Rankings" },
  { href: "/recipes", label: "Recipes" },
  { href: "/internet-recipes", label: "Internet Recipes" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  return (
    <nav className="mb-12 flex flex-wrap items-center justify-center gap-4 py-6 text-xs font-black uppercase tracking-[0.22em] text-black md:text-xs">
      {navItems.map((item, index) => (
        <div key={item.href} className="flex items-center gap-4">
          <Link href={item.href} className="transition hover:opacity-50">
            {item.label}
          </Link>

          {index < navItems.length - 1 && (
            <span className="text-gray-500">/</span>
          )}
        </div>
      ))}
    </nav>
  );
}