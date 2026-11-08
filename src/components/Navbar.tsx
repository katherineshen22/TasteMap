"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/add", label: "Add Dish" },
  { href: "/rankings", label: "Rankings" },
  { href: "/want-to-try", label: "Want to Try" },
  { href: "/recipes", label: "Recipes" },
  { href: "/people", label: "People" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Pending follow requests, refreshed on navigation (e.g. after accepting).
  useEffect(() => {
    if (!email) {
      setRequestCount(0);
      return;
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id)
        .eq("status", "pending");
      setRequestCount(count ?? 0);
    });
  }, [email, pathname]);

  const label = (item: { href: string; label: string }) =>
    item.href === "/people" && requestCount > 0 ? (
      <>
        {item.label}
        <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">
          {requestCount}
        </span>
      </>
    ) : (
      item.label
    );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const linkClass = (href: string) =>
    `rounded-full px-3 py-2 transition ${
      isActive(href)
        ? "bg-black text-white"
        : "text-gray-700 hover:bg-black/5 hover:text-black"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-[#faf7ef]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-black tracking-tight text-black">
          TasteMap
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 text-black md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        <div className="hidden items-center gap-1 text-sm font-semibold md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {label(item)}
            </Link>
          ))}
          <AuthButton
            authChecked={authChecked}
            email={email}
            onLogout={handleLogout}
            linkClass={linkClass("/login")}
          />
        </div>
      </nav>

      {menuOpen && (
        <div className="grid gap-1 border-t border-black/10 px-4 py-3 text-sm font-semibold md:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {label(item)}
            </Link>
          ))}
          <AuthButton
            authChecked={authChecked}
            email={email}
            onLogout={handleLogout}
            linkClass={linkClass("/login")}
          />
        </div>
      )}
    </header>
  );
}

function AuthButton({
  authChecked,
  email,
  onLogout,
  linkClass,
}: {
  authChecked: boolean;
  email: string | null;
  onLogout: () => void;
  linkClass: string;
}) {
  if (!authChecked) return null;

  if (email) {
    return (
      <button
        type="button"
        onClick={onLogout}
        title={`Signed in as ${email}`}
        className="rounded-full px-3 py-2 text-left text-gray-700 transition hover:bg-black/5 hover:text-black"
      >
        Log Out
      </button>
    );
  }

  return (
    <Link href="/login" className={linkClass}>
      Log In
    </Link>
  );
}
