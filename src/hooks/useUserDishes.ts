"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { Dish } from "@/types/food";

type Status = "loading" | "logged-out" | "ready";

// Loads the signed-in user's dishes, sorted by rating (highest first).
export function useUserDishes() {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setStatus("logged-out");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("user_id", user.id)
        .order("rating", { ascending: false });

      if (cancelled) return;

      if (error) {
        setError(error.message);
      } else {
        setDishes((data || []) as Dish[]);
      }

      setStatus("ready");
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, user, dishes, error };
}
