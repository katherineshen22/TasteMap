"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorMessage, inputClass, primaryButtonClass } from "@/components/ui";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in? Skip the login screen.
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/");
    });
  }, [router]);

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setNotice("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      // If email confirmation is off, Supabase signs the user in right away.
      if (data.session) {
        router.push("/");
        return;
      }

      setNotice(
        "Account created! Check your email for a confirmation link, then log in."
      );
      setMode("login");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <section className="mx-auto mt-4 max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-3xl font-black text-black">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>

      <p className="mb-6 text-gray-600">
        {mode === "login"
          ? "Log in to see your dishes and rankings."
          : "Sign up to start building your personal TasteMap."}
      </p>

      {notice && (
        <p className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1.5 font-medium text-gray-800">
          Email
          <input
            className={`${inputClass} font-normal`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-1.5 font-medium text-gray-800">
          Password
          <input
            className={`${inputClass} font-normal`}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {mode === "signup" && (
            <span className="text-sm font-normal text-gray-500">
              At least 6 characters.
            </span>
          )}
        </label>

        <ErrorMessage message={error} />

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Log In"
              : "Sign Up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {mode === "login" ? "New to TasteMap?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={switchMode}
          className="font-semibold text-black underline"
        >
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>
    </section>
  );
}
