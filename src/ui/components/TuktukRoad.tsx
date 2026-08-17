import { motion } from "framer-motion";

const ROAD_STRIPE_COUNT = 6;

/** Animated scrolling road backdrop for the Tuk-tuk Racing minigame. */
export function TuktukRoad() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-[30%] inset-y-0 bg-[#7BB88F]/40" />
      <motion.div
        className="absolute inset-x-[49.5%] inset-y-0"
        animate={{ y: ["0%", "100%"] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: ROAD_STRIPE_COUNT }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 rounded-full bg-[#FFF6E5]/60"
            style={{ height: 28, top: `${(i / ROAD_STRIPE_COUNT) * 100}%` }}
          />
        ))}
      </motion.div>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{ left: i % 2 === 0 ? "4%" : "80%", top: `${25 * i}%` }}
          animate={{ y: ["0%", "200%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: i * 0.35 }}
        >
          🌴
        </motion.div>
      ))}
    </div>
  );
}
