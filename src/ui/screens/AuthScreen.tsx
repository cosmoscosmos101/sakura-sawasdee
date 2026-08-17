import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../data/supabase";

interface Props {
  onComplete: () => void; // called after sign-in OR after "play offline"
}

type Mode = "choose" | "signin" | "signup";

export function AuthScreen({ onComplete }: Props) {
  const [mode, setMode]     = useState<Mode>("choose");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [name, setName]     = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!supabase) { onComplete(); return; }
    setLoading(true); setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (e) { setError(e.message); return; }
    onComplete();
  }

  async function handleSignUp() {
    if (!supabase) { onComplete(); return; }
    if (!name.trim()) { setError("Please enter a display name."); return; }
    setLoading(true); setError(null);
    const { error: e, data } = await supabase.auth.signUp({ email, password: pass });
    if (e) { setLoading(false); setError(e.message); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: name.trim(),
      });
    }
    setLoading(false);
    onComplete();
  }

  const inputCls = "w-full rounded-xl border-2 border-[#4A3F55] bg-[#FFF0F5] px-3 py-2 text-[12px] text-[#4A3F55] placeholder:text-[#9188A0] focus:outline-none focus:border-[#D97FA5]";
  const btnCls   = "w-full rounded-xl border-2 border-[#4A3F55] py-2 text-[12px] font-bold text-[#4A3F55] active:scale-95 transition-transform disabled:opacity-50";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-[#4A3F55]/70 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-xs rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5] p-5 shadow-xl"
      >
        <p className="mb-1 text-center text-[15px] font-bold text-[#4A3F55]">🌸 Sakura &amp; Sawasdee</p>
        <p className="mb-4 text-center text-[10px] text-[#9188A0]">Save your progress across devices</p>

        {mode === "choose" && (
          <div className="flex flex-col gap-2">
            <button onClick={() => setMode("signin")} className={`${btnCls} bg-[#FFD9E8]`}>Sign in</button>
            <button onClick={() => setMode("signup")} className={`${btnCls} bg-[#C8F2E0]`}>Create account</button>
            <button onClick={onComplete} className={`${btnCls} bg-[#E0D7FF] text-[10px] font-normal`}>
              Play offline (progress stays on this device)
            </button>
          </div>
        )}

        {(mode === "signin" || mode === "signup") && (
          <div className="flex flex-col gap-2">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
            <input
              type="password"
              placeholder="Password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void (mode === "signin" ? handleSignIn() : handleSignUp()); }}
              className={inputCls}
            />
            {error && <p className="text-[10px] text-[#D97FA5]">{error}</p>}
            <button
              onClick={() => void (mode === "signin" ? handleSignIn() : handleSignUp())}
              disabled={loading || !email || !pass}
              className={`${btnCls} bg-[#FFD9E8]`}
            >
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
            <button onClick={() => { setMode("choose"); setError(null); }} className="text-[10px] text-[#9188A0] underline">
              Back
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
