// Client-side helpers for profiles and follows. Who-can-see-what is enforced
// by Postgres row-level security (see supabase/migrations/*_social.sql);
// these functions just make the requests.
import { supabase } from "@/lib/supabaseClient";
import { Follow, FollowStatus, Profile } from "@/types/food";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function displayName(profile?: Pick<Profile, "username" | "display_name"> | null) {
  return profile?.display_name?.trim() || (profile ? `@${profile.username}` : "Someone");
}

export function initials(profile?: Pick<Profile, "username" | "display_name"> | null) {
  const name = profile?.display_name?.trim() || profile?.username || "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export async function getProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile) || null;
}

export async function getProfileByUsername(username: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return (data as Profile) || null;
}

export async function getProfiles(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, Profile>;
  const { data } = await supabase.from("profiles").select("*").in("id", ids);
  return Object.fromEntries(((data as Profile[]) || []).map((p) => [p.id, p]));
}

export async function searchProfiles(query: string, excludeId?: string) {
  // Strip characters that have meaning in PostgREST filter syntax.
  const term = query.trim().replace(/[%,()*"\\:]/g, "").slice(0, 50);
  if (!term) return [];
  let request = supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .order("username")
    .limit(20);
  if (excludeId) request = request.neq("id", excludeId);
  const { data } = await request;
  return (data as Profile[]) || [];
}

// My follow row toward `targetId`, if any.
export async function getFollow(myId: string, targetId: string) {
  const { data } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", myId)
    .eq("following_id", targetId)
    .maybeSingle();
  return (data as Follow) || null;
}

// Public accounts are followed instantly; private ones get a request.
export async function follow(myId: string, target: Profile): Promise<FollowStatus> {
  const status: FollowStatus = target.is_private ? "pending" : "accepted";
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: myId, following_id: target.id, status });
  if (error) throw new Error(error.message);
  return status;
}

export async function unfollow(myId: string, targetId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", myId)
    .eq("following_id", targetId);
  if (error) throw new Error(error.message);
}

export async function acceptRequest(myId: string, followerId: string) {
  const { error } = await supabase
    .from("follows")
    .update({ status: "accepted" })
    .eq("follower_id", followerId)
    .eq("following_id", myId);
  if (error) throw new Error(error.message);
}

// Declines a request, or removes an existing follower.
export async function removeFollower(myId: string, followerId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", myId);
  if (error) throw new Error(error.message);
}

export async function acceptAllRequests(myId: string) {
  await supabase
    .from("follows")
    .update({ status: "accepted" })
    .eq("following_id", myId)
    .eq("status", "pending");
}

export async function getFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId)
      .eq("status", "accepted"),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId)
      .eq("status", "accepted"),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

// Profiles on either side of a user's accepted follows.
export async function getFollowList(userId: string, direction: "followers" | "following") {
  const [mine, theirs] =
    direction === "followers"
      ? (["following_id", "follower_id"] as const)
      : (["follower_id", "following_id"] as const);
  const { data } = await supabase
    .from("follows")
    .select("*")
    .eq(mine, userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });
  const ids = ((data as Follow[]) || []).map((row) => row[theirs]);
  const profiles = await getProfiles(ids);
  return ids.map((id) => profiles[id]).filter(Boolean);
}

export async function getIncomingRequests(myId: string) {
  const { data } = await supabase
    .from("follows")
    .select("*")
    .eq("following_id", myId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const ids = ((data as Follow[]) || []).map((row) => row.follower_id);
  const profiles = await getProfiles(ids);
  return ids.map((id) => profiles[id]).filter(Boolean);
}

export async function getFollowingIds(myId: string) {
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", myId)
    .eq("status", "accepted");
  return ((data as { following_id: string }[]) || []).map((row) => row.following_id);
}
