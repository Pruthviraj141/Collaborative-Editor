"use client";

import { useEffect, useState } from "react";

export function LiveDemo() {
  const [lineWidths, setLineWidths] = useState([90, 85, 70]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineWidths((previous) => {
        const next = [...previous];
        const index = Math.floor(Math.random() * next.length);
        next[index] = Math.min(96, next[index] + 5);
        if (next[index] >= 96) {
          next[index] = 70;
        }
        return next;
      });
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="bg-[#080812] px-4 py-20 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold text-white">See it in action</h2>
          <p className="mt-3 text-white/50">A real look at the editor experience.</p>
        </div>

        <div className="mx-auto max-w-[860px] overflow-hidden rounded-[14px] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
          <div className="flex h-11 items-center gap-2 bg-[#1c1c2e] px-4">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />

            <div className="mx-auto flex h-[26px] w-full max-w-[300px] items-center justify-center rounded-md bg-white/[0.07] text-xs text-white/40">
              collab.app/editor?docId=...
            </div>
          </div>

          <div className="bg-[#13131f] px-8 py-6 md:min-h-[340px]">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-1.5">
              {[
                "B",
                "I",
                "U",
                "|",
                "H1",
                "H2",
                "•",
                "AI Diagram"
              ].map((item) => (
                <div
                  key={item}
                  className={`flex h-6 items-center justify-center rounded px-2 text-xs ${
                    item === "AI Diagram" ? "bg-violet-600/25 text-violet-300 shadow-[0_0_20px_rgba(124,58,237,0.25)]" : "text-white/40"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded bg-white/[0.12] px-3 py-1.5 text-[22px] font-bold text-white/80 md:w-[60%]">Q4 Product Roadmap</div>

            <div className="mt-3 h-3 rounded bg-white/[0.08]" style={{ width: `${lineWidths[0]}%` }} />
            <div className="mt-3 h-3 rounded bg-white/[0.08]" style={{ width: `${lineWidths[1]}%` }} />
            <div className="mt-3 h-3 rounded bg-white/[0.08]" style={{ width: `${lineWidths[2]}%` }} />

            <div className="mt-5 rounded-[10px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-center justify-center gap-3 text-center text-[13px]">
                <div className="rounded-lg border border-violet-400/50 bg-violet-600/20 px-4 py-2 text-violet-300">User Login</div>
                <span className="text-white/30">→</span>
                <div className="rounded-lg border border-violet-400/50 bg-violet-600/20 px-4 py-2 text-violet-300">Verify Token</div>
                <span className="text-white/30">→</span>
                <div className="rounded-lg border border-violet-400/50 bg-violet-600/20 px-4 py-2 text-violet-300">Load Dashboard</div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
              <span className="hero-live-dot inline-block h-2 w-2 rounded-full bg-green-500" />
              <span>Alex is editing...</span>
              <span>Riya is viewing...</span>
              <span className="hero-cursor text-violet-300">|</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
