"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const phrases = ["teams think together.", "ideas become diagrams.", "docs write themselves.", "work feels effortless."];

const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

export function Hero() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typedText, setTypedText] = useState("");

  const currentPhrase = phrases[phraseIndex] ?? phrases[0];
  const longestPhraseLength = useMemo(() => Math.max(...phrases.map((item) => item.length)), []);

  useEffect(() => {
    let active = true;

    const runTypewriter = async () => {
      let index = 0;

      while (active) {
        const phrase = phrases[index] ?? phrases[0];

        for (let i = 1; i <= phrase.length; i += 1) {
          if (!active) {
            return;
          }

          setPhraseIndex(index);
          setTypedText(phrase.slice(0, i));
          await delay(65);
        }

        await delay(2000);

        for (let i = phrase.length - 1; i >= 0; i -= 1) {
          if (!active) {
            return;
          }

          setTypedText(phrase.slice(0, i));
          await delay(35);
        }

        await delay(400);
        index = (index + 1) % phrases.length;
      }
    };

    void runTypewriter();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="hero-section relative flex min-h-screen items-center overflow-hidden px-4 pt-24 md:px-8">
      <div className="hero-dot-grid" aria-hidden="true" />
      <div className="hero-blob hero-blob-one" aria-hidden="true" />
      <div className="hero-blob hero-blob-two" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <div className="hero-anim hero-delay-0 inline-flex items-center rounded-full border border-violet-400/50 bg-violet-500/10 px-4 py-1.5 text-[13px] text-violet-300">
          <span className="hero-pulse mr-2">✦</span>
          Real-time collaboration · AI diagrams · Excalidraw built in
        </div>

        <h1 className="hero-anim hero-delay-180 mt-7 text-[clamp(3rem,7vw,5.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
          <span className="block">The editor where</span>
          <span className="mt-2 block" style={{ minHeight: "1.2em" }}>
            <span className="hero-typed-gradient">{typedText || "\u00A0"}</span>
            <span className="hero-cursor" style={{ marginLeft: "4px" }}>
              |
            </span>
            <span className="sr-only">{currentPhrase}</span>
            <span aria-hidden="true" className="pointer-events-none absolute opacity-0">
              {"W".repeat(longestPhraseLength)}
            </span>
          </span>
        </h1>

        <p className="hero-anim hero-delay-360 mx-auto mt-7 max-w-[560px] text-[1.2rem] leading-[1.7] text-white/60">
          Create documents, draw diagrams, and collaborate in real time — powered by Yjs, Tiptap, and AI generation via Groq.
        </p>

        <div className="hero-anim hero-delay-520 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth?tab=signup"
            className="hero-primary-btn rounded-[10px] px-8 py-3.5 text-base font-semibold text-white"
          >
            Start writing free
          </Link>
          <Link
            href="/auth"
            className="rounded-[10px] border border-white/20 px-8 py-3.5 text-base font-medium text-white transition-all duration-200 ease-in hover:bg-white/5"
          >
            Sign in
          </Link>
        </div>

        <div className="hero-anim hero-delay-680 mt-8 flex items-center justify-center gap-3">
          <div className="flex items-center">
            {[
              { initials: "AK", color: "#7c3aed" },
              { initials: "RS", color: "#0891b2" },
              { initials: "MT", color: "#059669" },
              { initials: "JL", color: "#d97706" },
              { initials: "PW", color: "#dc2626" }
            ].map((avatar, index) => (
              <div
                key={avatar.initials}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-semibold text-white"
                style={{
                  marginLeft: index === 0 ? "0px" : "-10px",
                  backgroundColor: avatar.color,
                  borderColor: "#080812"
                }}
              >
                {avatar.initials}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[13px] text-white/45">
            <span className="hero-live-dot inline-block h-2 w-2 rounded-full bg-green-500" />
            12 people editing right now
          </div>
        </div>
      </div>
    </section>
  );
}
