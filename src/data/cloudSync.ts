/**
 * Last-write-wins cloud sync via Supabase.
 * All functions are no-ops when the user is unauthenticated or offline.
 */

import { supabase } from "./supabase";
import { db, type SrsCard, type RoomState } from "./db";

// ── Row shapes (Supabase table columns) ───────────────────────────────────────

interface RemoteSrsCard {
  user_id: string;
  vocab_id: string;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: number;
}

interface WeeklyScoreRow {
  user_id: string;
  display_name: string;
  battles_won: number;
  words_reviewed: number;
  score: number;
}

export interface LeagueEntry {
  userId: string;
  displayName: string;
  battlesWon: number;
  wordsReviewed: number;
  score: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toRemote(card: SrsCard, userId: string): RemoteSrsCard {
  return {
    user_id:       userId,
    vocab_id:      card.vocabId,
    due:           card.due,
    stability:     card.stability,
    difficulty:    card.difficulty,
    elapsed_days:  card.elapsedDays,
    scheduled_days: card.scheduledDays,
    reps:          card.reps,
    lapses:        card.lapses,
    state:         card.state,
    last_review:   card.lastReview,
  };
}

function fromRemote(r: RemoteSrsCard): SrsCard {
  return {
    vocabId:       r.vocab_id,
    due:           r.due,
    stability:     r.stability,
    difficulty:    r.difficulty,
    elapsedDays:   r.elapsed_days,
    scheduledDays: r.scheduled_days,
    reps:          r.reps,
    lapses:        r.lapses,
    state:         r.state,
    lastReview:    r.last_review,
  };
}

function isoWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

async function getUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// ── SRS card sync (last-write-wins on lastReview timestamp) ──────────────────

export async function syncSrsCards(): Promise<{ pushed: number; pulled: number }> {
  if (!supabase) return { pushed: 0, pulled: 0 };
  const user = await getUser();
  if (!user) return { pushed: 0, pulled: 0 };

  const [localCards, { data }] = await Promise.all([
    db.srsCards.toArray(),
    supabase.from("srs_cards").select("*").eq("user_id", user.id),
  ]);

  const remoteRows = (data ?? []) as unknown as RemoteSrsCard[];
  const remoteMap  = new Map(remoteRows.map((r) => [r.vocab_id, r]));
  const localMap   = new Map(localCards.map((c) => [c.vocabId, c]));

  const toPush = localCards.filter((c) => {
    const r = remoteMap.get(c.vocabId);
    return !r || c.lastReview > r.last_review;
  });

  const toPull = remoteRows.filter((r) => {
    const c = localMap.get(r.vocab_id);
    return !c || r.last_review > c.lastReview;
  });

  await Promise.all([
    toPush.length > 0
      ? supabase.from("srs_cards").upsert(
          toPush.map((c) => toRemote(c, user.id)),
          { onConflict: "user_id,vocab_id" },
        )
      : Promise.resolve(),
    toPull.length > 0
      ? db.srsCards.bulkPut(toPull.map(fromRemote))
      : Promise.resolve(),
  ]);

  return { pushed: toPush.length, pulled: toPull.length };
}

// ── Room state sync ───────────────────────────────────────────────────────────

export async function pushRoomState(room: RoomState): Promise<void> {
  if (!supabase) return;
  const user = await getUser();
  if (!user) return;
  await supabase.from("room_states").upsert(
    { user_id: user.id, placed: room.placed, display_case: room.displayCase },
    { onConflict: "user_id" },
  );
}

export async function fetchFriendRoom(userId: string): Promise<RoomState | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("room_states")
    .select("placed,display_case")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as { placed: RoomState["placed"]; display_case: RoomState["displayCase"] };
  return { id: 1, placed: row.placed, displayCase: row.display_case };
}

// ── Weekly league ─────────────────────────────────────────────────────────────

export async function pushWeeklyScore(
  battlesWon: number,
  wordsReviewed: number,
  displayName: string,
): Promise<void> {
  if (!supabase) return;
  const user = await getUser();
  if (!user) return;
  await supabase.from("weekly_scores").upsert(
    {
      user_id:       user.id,
      display_name:  displayName,
      week_start:    isoWeekStart(),
      battles_won:   battlesWon,
      words_reviewed: wordsReviewed,
    },
    { onConflict: "user_id,week_start" },
  );
}

export async function fetchLeague(): Promise<LeagueEntry[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("weekly_scores")
    .select("user_id,display_name,battles_won,words_reviewed,score")
    .eq("week_start", isoWeekStart())
    .order("score", { ascending: false })
    .limit(10);
  return ((data ?? []) as unknown as WeeklyScoreRow[]).map((r) => ({
    userId:       r.user_id,
    displayName:  r.display_name,
    battlesWon:   r.battles_won,
    wordsReviewed: r.words_reviewed,
    score:        r.score,
  }));
}

// ── Friends ───────────────────────────────────────────────────────────────────

export interface Friend {
  userId: string;
  displayName: string;
  accepted: boolean;
  isRequester: boolean;
}

export async function fetchFriends(): Promise<Friend[]> {
  if (!supabase) return [];
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("friendships")
    .select("requester_id,addressee_id,accepted,profiles!friendships_addressee_id_fkey(display_name),profiles!friendships_requester_id_fkey(display_name)")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  type FriendRow = {
    requester_id: string;
    addressee_id: string;
    accepted: boolean;
  };

  return ((data ?? []) as unknown as FriendRow[]).map((r) => {
    const isRequester = r.requester_id === user.id;
    return {
      userId:      isRequester ? r.addressee_id : r.requester_id,
      displayName: isRequester ? r.addressee_id : r.requester_id, // fallback to id
      accepted:    r.accepted,
      isRequester,
    };
  });
}

export async function sendFriendRequest(addresseeEmail: string): Promise<string | null> {
  if (!supabase) return "Offline — sign in to add friends";
  const user = await getUser();
  if (!user) return "Not signed in";
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", addresseeEmail)
    .maybeSingle();
  if (!profile) return "Player not found";
  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: (profile as unknown as { id: string }).id,
  });
  return error ? error.message : null;
}

export async function acceptFriendRequest(requesterId: string): Promise<void> {
  if (!supabase) return;
  const user = await getUser();
  if (!user) return;
  await supabase
    .from("friendships")
    .update({ accepted: true })
    .eq("requester_id", requesterId)
    .eq("addressee_id", user.id);
}
