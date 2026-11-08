"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { displayName, follow, getFollow, initials, unfollow } from "@/lib/social";
import { FollowStatus, Profile } from "@/types/food";

const COLORS = [
  "bg-amber-200 text-amber-900",
  "bg-sky-200 text-sky-900",
  "bg-emerald-200 text-emerald-900",
  "bg-rose-200 text-rose-900",
  "bg-violet-200 text-violet-900",
  "bg-orange-200 text-orange-900",
];

export function Avatar({
  profile,
  size = "md",
}: {
  profile?: Profile | null;
  size?: "sm" | "md" | "lg";
}) {
  const hash = [...(profile?.username || "")].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-2xl" };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-black ${sizes[size]} ${COLORS[hash % COLORS.length]}`}
      aria-hidden
    >
      {initials(profile)}
    </span>
  );
}

export function FollowButton({
  myId,
  target,
  onChange,
}: {
  myId: string;
  target: Profile;
  onChange?: (status: FollowStatus | null) => void;
}) {
  const [status, setStatus] = useState<FollowStatus | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getFollow(myId, target.id).then((row) => {
      if (!cancelled) setStatus(row?.status ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [myId, target.id]);

  async function handleClick() {
    if (busy) return;
    if (status && !window.confirm(
      status === "pending" ? "Cancel your follow request?" : `Unfollow ${displayName(target)}?`
    )) return;

    setBusy(true);
    setError("");
    try {
      if (status) {
        await unfollow(myId, target.id);
        setStatus(null);
        onChange?.(null);
      } else {
        const next = await follow(myId, target);
        setStatus(next);
        onChange?.(next);
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setBusy(false);
  }

  if (myId === target.id || status === undefined) return null;

  const label =
    status === "accepted" ? "Following" : status === "pending" ? "Requested" : "Follow";

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={
          status
            ? "rounded-full border border-black/20 px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-700 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            : "rounded-full bg-black px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:opacity-80 disabled:opacity-50"
        }
      >
        {busy ? "..." : label}
      </button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </span>
  );
}

export function PersonRow({
  profile,
  myId,
  actions,
}: {
  profile: Profile;
  myId?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <Link href={`/u/${profile.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar profile={profile} />
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900 hover:underline">
            {displayName(profile)}
            {profile.is_private && (
              <span className="ml-1.5 text-xs" title="Private account">🔒</span>
            )}
          </p>
          <p className="truncate text-sm text-gray-500">
            @{profile.username}
            {profile.bio ? ` · ${profile.bio}` : ""}
          </p>
        </div>
      </Link>
      {actions ?? (myId && <FollowButton myId={myId} target={profile} />)}
    </div>
  );
}
