import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../data/supabase";
import { syncSrsCards, fetchLeague, fetchFriends, sendFriendRequest,
         acceptFriendRequest, fetchFriendRoom, type LeagueEntry, type Friend } from "../../data/cloudSync";
import { RoomSnapshot } from "../components/RoomSnapshot";
import type { RoomState } from "../../data/db";

interface Props { onClose: () => void }
type Tab = "league" | "friends";

export function ProfilePanel({ onClose }: Props) {
  const [tab, setTab]       = useState<Tab>("league");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState<string | null>(null);

  // League state
  const [league, setLeague] = useState<LeagueEntry[]>([]);
  // Friends state
  const [friends, setFriends]   = useState<Friend[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [addMsg, setAddMsg]     = useState<string | null>(null);
  // Room visit state
  const [visitRoom, setVisitRoom] = useState<RoomState | null>(null);
  const [visitName, setVisitName] = useState("");

  useEffect(() => {
    void (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
      const [l, f] = await Promise.all([fetchLeague(), fetchFriends()]);
      setLeague(l);
      setFriends(f);
    })();
  }, []);

  async function handleSync() {
    setSyncing(true); setSyncMsg(null);
    const { pushed, pulled } = await syncSrsCards();
    setSyncMsg(`↑${pushed} pushed · ↓${pulled} pulled`);
    setSyncing(false);
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    onClose();
  }

  async function handleAddFriend() {
    setAddMsg(null);
    const err = await sendFriendRequest(addEmail.trim());
    setAddMsg(err ?? "Request sent!");
    if (!err) setAddEmail("");
  }

  async function handleVisitRoom(friend: Friend) {
    const room = await fetchFriendRoom(friend.userId);
    if (room) { setVisitRoom(room); setVisitName(friend.displayName); }
  }

  const tabBtn = (t: Tab) =>
    `rounded-lg px-3 py-1 text-[10px] font-bold transition-colors ${
      tab === t ? "bg-[#F7A8C4] text-[#4A3F55]" : "text-[#9188A0]"
    }`;

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col bg-[#FFF6E5] p-4">

      {visitRoom ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-bold text-[#4A3F55]">🏠 {visitName}'s room</p>
            <button onClick={() => setVisitRoom(null)}
              className="rounded-xl border-2 border-[#4A3F55] bg-[#F7A8C4] px-3 py-1 text-[10px] font-semibold text-[#4A3F55]">
              Back
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <RoomSnapshot room={visitRoom} cellPx={28} />
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[14px] font-bold text-[#4A3F55]">👤 Profile</p>
            <button onClick={onClose}
              className="rounded-xl border-2 border-[#4A3F55] bg-[#F7A8C4] px-3 py-1.5 text-sm font-semibold text-[#4A3F55]">✕</button>
          </div>

          {/* Auth row */}
          <div className="mb-3 flex items-center justify-between rounded-xl bg-[#FFD9E8]/60 px-3 py-2">
            <p className="text-[10px] text-[#4A3F55]">
              {userEmail ? `Signed in as ${userEmail}` : (supabase ? "Not signed in" : "Offline mode")}
            </p>
            <div className="flex gap-2">
              {userEmail && (
                <button onClick={() => void handleSync()} disabled={syncing}
                  className="rounded-lg border border-[#4A3F55] bg-[#C8F2E0] px-2 py-0.5 text-[9px] font-semibold text-[#4A3F55] disabled:opacity-50">
                  {syncing ? "…" : "Sync"}
                </button>
              )}
              {userEmail && (
                <button onClick={() => void handleSignOut()}
                  className="rounded-lg border border-[#4A3F55] bg-[#E0D7FF] px-2 py-0.5 text-[9px] font-semibold text-[#4A3F55]">
                  Sign out
                </button>
              )}
            </div>
          </div>
          {syncMsg && <p className="mb-2 text-center text-[9px] text-[#9188A0]">{syncMsg}</p>}

          {/* Tabs */}
          <div className="mb-3 flex gap-1">
            <button className={tabBtn("league")} onClick={() => setTab("league")}>🏆 League</button>
            <button className={tabBtn("friends")} onClick={() => setTab("friends")}>👥 Friends</button>
          </div>

          {/* League tab */}
          {tab === "league" && (
            <div className="flex-1 overflow-y-auto">
              {league.length === 0 ? (
                <p className="text-center text-[10px] text-[#9188A0]">
                  {supabase ? "No scores yet this week — play to appear!" : "Sign in to join a league"}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {league.map((entry, i) => (
                    <div key={entry.userId}
                      className="flex items-center justify-between rounded-xl bg-[#E0D7FF]/40 px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-[10px] font-bold text-[#9188A0]">#{i + 1}</span>
                        <span className="text-[11px] font-semibold text-[#4A3F55]">{entry.displayName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[12px] font-bold text-[#4A3F55]">{entry.score}</span>
                        <span className="ml-1 text-[8px] text-[#9188A0]">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friends tab */}
          {tab === "friends" && (
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="Friend's email…"
                  className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#FFF0F5] px-2 py-1 text-[11px] text-[#4A3F55] placeholder:text-[#9188A0] focus:outline-none"
                />
                <button onClick={() => void handleAddFriend()}
                  className="rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] px-3 py-1 text-[10px] font-bold text-[#4A3F55]">
                  Add
                </button>
              </div>
              {addMsg && <p className="text-[9px] text-[#9188A0]">{addMsg}</p>}
              {friends.length === 0 ? (
                <p className="text-center text-[10px] text-[#9188A0]">
                  {supabase ? "No friends yet — add one above!" : "Sign in to connect with friends"}
                </p>
              ) : (
                friends.map((f) => (
                  <div key={f.userId}
                    className="flex items-center justify-between rounded-xl bg-[#C8F2E0]/40 px-3 py-1.5">
                    <div>
                      <span className="text-[11px] font-semibold text-[#4A3F55]">{f.displayName}</span>
                      {!f.accepted && (
                        <span className="ml-2 text-[8px] text-[#9188A0]">
                          {f.isRequester ? "pending" : "wants to be friends"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {!f.accepted && !f.isRequester && (
                        <button
                          onClick={() => void acceptFriendRequest(f.userId).then(() =>
                            setFriends((prev) => prev.map((x) => x.userId === f.userId ? { ...x, accepted: true } : x))
                          )}
                          className="rounded border border-[#4A3F55] bg-[#C8F2E0] px-1.5 py-0.5 text-[8px] font-bold text-[#4A3F55]">
                          Accept
                        </button>
                      )}
                      {f.accepted && (
                        <button onClick={() => void handleVisitRoom(f)}
                          className="rounded border border-[#4A3F55] bg-[#BDE3FF] px-1.5 py-0.5 text-[8px] font-bold text-[#4A3F55]">
                          Visit room
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
