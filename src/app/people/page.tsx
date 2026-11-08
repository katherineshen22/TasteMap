"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PersonRow } from "@/components/social";
import {
  LoadingState,
  LoginPrompt,
  PageHeader,
  cardClass,
  inputClass,
  primaryButtonClass,
} from "@/components/ui";
import { useMyProfile } from "@/hooks/useMyProfile";
import {
  acceptRequest,
  getFollowList,
  getIncomingRequests,
  removeFollower,
  searchProfiles,
} from "@/lib/social";
import { Profile } from "@/types/food";

export default function PeoplePage() {
  const { status, user, profile } = useMyProfile();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [requests, setRequests] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);

  const loadLists = useCallback(async () => {
    if (!user) return;
    const [incoming, mine] = await Promise.all([
      getIncomingRequests(user.id),
      getFollowList(user.id, "following"),
    ]);
    setRequests(incoming);
    setFollowing(mine);
  }, [user]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // Search as you type, with a short debounce.
  useEffect(() => {
    if (!user || !query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      setResults(await searchProfiles(query, user.id));
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, user]);

  async function respond(requester: Profile, accept: boolean) {
    if (!user) return;
    if (accept) await acceptRequest(user.id, requester.id);
    else await removeFollower(user.id, requester.id);
    setRequests((current) => current.filter((p) => p.id !== requester.id));
  }

  if (status === "loading") return <LoadingState />;
  if (status === "logged-out") return <LoginPrompt reason="Log in to find friends." />;

  return (
    <>
      <PageHeader
        title="People"
        description="Find friends and see what they're eating."
        action={
          profile && (
            <Link href={`/u/${profile.username}`} className="text-sm font-semibold text-gray-600 hover:text-black">
              View my profile →
            </Link>
          )
        }
      />

      {!profile && (
        <div className={`${cardClass} mb-8 flex flex-wrap items-center justify-between gap-4 bg-[#faf7ef]`}>
          <div>
            <h2 className="font-black text-black">Set up your profile first</h2>
            <p className="text-sm text-gray-600">
              Pick a username so friends can find you and you can follow them.
            </p>
          </div>
          <Link href="/settings/profile" className={primaryButtonClass}>
            Create Profile
          </Link>
        </div>
      )}

      {requests.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-black text-black">
            Follow requests <span className="text-gray-400">{requests.length}</span>
          </h2>
          <div className="grid gap-2">
            {requests.map((requester) => (
              <PersonRow
                key={requester.id}
                profile={requester}
                actions={
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => respond(requester, true)}
                      className="rounded-full bg-black px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:opacity-80"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(requester, false)}
                      className="rounded-full border border-black/20 px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-700 hover:border-black"
                    >
                      Decline
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      )}

      {profile && (
        <section className="mb-10">
          <input
            type="search"
            className={inputClass}
            placeholder="🔍 Search by username or name..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search people"
            autoFocus
          />
          {query.trim() && (
            <div className="mt-3 grid gap-2">
              {searching && results.length === 0 ? (
                <p className="py-4 text-center text-gray-500">Searching...</p>
              ) : results.length === 0 ? (
                <p className="py-4 text-center text-gray-500">
                  No one found for &ldquo;{query}&rdquo;. Ask your friend for their username.
                </p>
              ) : (
                results.map((person) => (
                  <PersonRow key={person.id} profile={person} myId={user!.id} />
                ))
              )}
            </div>
          )}
        </section>
      )}

      {profile && !query.trim() && (
        <section>
          <h2 className="mb-3 text-xl font-black text-black">
            Following <span className="text-gray-400">{following.length}</span>
          </h2>
          {following.length === 0 ? (
            <p className="text-gray-600">
              You&apos;re not following anyone yet. Search for friends above, or share
              your username <b>@{profile.username}</b> so they can find you.
            </p>
          ) : (
            <div className="grid gap-2">
              {following.map((person) => (
                <PersonRow key={person.id} profile={person} myId={user!.id} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
