"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage("Account created. Check your email if confirmation is required, then log in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#faf7ef] p-8">
      <Navbar />

      <section className="mx-auto max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-3xl font-black text-black">
          {mode === "login" ? "Log In" : "Create Account"}
        </h1>

        <p className="mb-6 text-gray-700">
          Log in to save your own dishes and build your personal TasteMap.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1 font-medium text-gray-800">
            Email
            <input
              className="rounded-xl border border-gray-300 bg-white p-3 font-normal text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-1 font-medium text-gray-800">
            Password
            <input
              className="rounded-xl border border-gray-300 bg-white p-3 font-normal text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button className="rounded-full bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:opacity-80">
            {loading ? "Loading..." : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-6 text-sm font-semibold text-black underline"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}