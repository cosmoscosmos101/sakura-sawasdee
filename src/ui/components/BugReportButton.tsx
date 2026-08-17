import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../data/db";

export function BugReportButton() {
  const [open, setOpen]     = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function openReport() {
    const [events, cards] = await Promise.all([
      db.analyticsEvents.orderBy("ts").reverse().limit(20).toArray(),
      db.srsCards.toArray(),
    ]);
    const payload = {
      generatedAt: new Date().toISOString(),
      browser:     { ua: navigator.userAgent, lang: navigator.language },
      display:     { w: screen.width, h: screen.height, dpr: devicePixelRatio },
      srsCards:    cards.length,
      recentEvents: events.map((e) => ({
        ts:   new Date(e.ts).toISOString(),
        type: e.type,
        data: e.data,
      })),
    };
    setReport(JSON.stringify(payload, null, 2));
    setOpen(true);
  }

  function copyReport() {
    if (!report) return;
    void navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([report], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `sakura-bug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        onClick={() => void openReport()}
        aria-label="Report a bug"
        title="Report a bug"
        className="pointer-events-auto rounded-lg border border-[#9188A0]/40 bg-[#FFF6E5]/70 px-1.5 py-1 text-[9px] text-[#9188A0] transition-colors hover:text-[#4A3F55]"
      >
        🐛
      </button>

      <AnimatePresence>
        {open && report && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[#4A3F55]/60 p-4"
          >
            <div className="flex w-full max-w-sm flex-col rounded-2xl border-2 border-[#4A3F55] bg-[#FFF6E5] p-4 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#4A3F55]">🐛 Bug Report</p>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close bug report"
                  className="rounded-lg border border-[#4A3F55] px-2 py-1 text-[10px] text-[#4A3F55]"
                >✕</button>
              </div>
              <p className="mb-3 text-[9px] leading-relaxed text-[#9188A0]">
                Nothing is sent anywhere. Share this file only if you choose to.
              </p>
              <pre className="mb-3 max-h-40 overflow-y-auto rounded-xl bg-[#E0D7FF]/40 p-2 text-[8px] leading-relaxed text-[#4A3F55]">
                {report}
              </pre>
              <div className="flex gap-2">
                <button
                  onClick={copyReport}
                  className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#FFD9E8] py-1.5 text-[11px] font-semibold text-[#4A3F55]"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={downloadReport}
                  className="flex-1 rounded-xl border-2 border-[#4A3F55] bg-[#C8F2E0] py-1.5 text-[11px] font-semibold text-[#4A3F55]"
                >
                  Download
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
