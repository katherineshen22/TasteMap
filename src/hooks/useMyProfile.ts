"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { getProfile } from "@/lib/social";
import { Profile } from "@/types/food";

type Status = "loading" | "logged-out" | "ready";

// The signed-in user plus their social profile (null until they create one).
export function useMyProfile() {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const reload = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("logged-out");
      return;
    }
    setUser(user);
    setProfile(await getProfile(user.id));
    setStatus("ready");
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { status, user, profile, reload };
}
