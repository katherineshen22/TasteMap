"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ErrorMessage,
  LoadingState,
  LoginPrompt,
  PageHeader,
  inputClass,
  primaryButtonClass,
} from "@/components/ui";
import { useMyProfile } from "@/hooks/useMyProfile";
import { USERNAME_PATTERN, acceptAllRequests } from "@/lib/social";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { status, user, profile } = useMyProfile();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "ready") return;
    setUsername(profile?.username || user?.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "");
    setName(profile?.display_name || "");
    setBio(profile?.bio || "");
    setIsPrivate(profile?.is_private ?? true);
  }, [status, profile, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    const cleanUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(cleanUsername)) {
      setError("Usernames are 3–20 characters: lowercase letters, numbers, and underscores.");
      return;
    }

    setSaving(true);
    setError("");

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: cleanUsername,
      display_name: name.trim() || null,
      bio: bio.trim() || null,
      is_private: isPrivate,
    });

    if (error) {
      setError(
        error.code === "23505"
          ? "That username is taken. Try another one."
          : `Couldn't save profile: ${error.message}`
      );
      setSaving(false);
      return;
    }

    // Going public: anyone waiting for approval can now see your posts anyway.
    if (profile?.is_private && !isPrivate) await acceptAllRequests(user.id);

    router.push(`/u/${cleanUsername}`);
  }

  if (status === "loading") return <LoadingState />;
  if (status === "logged-out") {
    return <LoginPrompt reason="Log in to set up your profile." />;
  }

  return (
    <>
      <PageHeader
        title={profile ? "Edit Profile" : "Set Up Your Profile"}
        description="Your profile lets friends find you and follow what you eat."
      />

      <form
        onSubmit={handleSubmit}
        className="grid max-w-xl gap-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
      >
        <label className="grid gap-1.5 font-medium text-gray-800">
          Username *
          <div className="flex items-center rounded-xl border border-gray-300 bg-white focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-200">
            <span className="pl-3 text-gray-400">@</span>
            <input
              className="w-full rounded-xl bg-transparent p-3 pl-1 font-normal text-gray-900 outline-none"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              }
              maxLength={20}
              required
              autoFocus={!profile}
            />
          </div>
          <span className="text-sm font-normal text-gray-500">
            Friends can search for you by this.
          </span>
        </label>

        <label className="grid gap-1.5 font-medium text-gray-800">
          Display name
          <input
            className={`${inputClass} font-normal`}
            placeholder="e.g. Katherine"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={50}
          />
        </label>

        <label className="grid gap-1.5 font-medium text-gray-800">
          Bio
          <textarea
            className={`${inputClass} min-h-20 font-normal`}
            placeholder="e.g. Philly-based noodle hunter 🍜"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={160}
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="mb-1 font-medium text-gray-800">Who can see your dishes and recipes?</legend>
          {[
            {
              value: true,
              title: "🔒 Private",
              text: "You approve each follower. Only approved followers see what you log.",
            },
            {
              value: false,
              title: "🌎 Public",
              text: "Anyone with a TasteMap account can follow you and see what you log.",
            },
          ].map((option) => (
            <label
              key={String(option.value)}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                isPrivate === option.value
                  ? "border-black bg-[#faf7ef]"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="privacy"
                checked={isPrivate === option.value}
                onChange={() => setIsPrivate(option.value)}
                className="mt-1 accent-black"
              />
              <span>
                <span className="block font-bold text-gray-900">{option.title}</span>
                <span className="text-sm text-gray-600">{option.text}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <ErrorMessage message={error} />

        <button type="submit" disabled={saving} className={`${primaryButtonClass} justify-self-start`}>
          {saving ? "Saving..." : profile ? "Save Profile" : "Create Profile"}
        </button>
      </form>
    </>
  );
}
