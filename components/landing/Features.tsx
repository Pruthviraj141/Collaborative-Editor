"use client";

import { useEffect, useRef } from "react";
import { FileText, History, Lock, PenTool, Sparkles, Users2 } from "lucide-react";

const features = [
  {
    title: "Real-time collaboration",
    description:
      "Edit the same document simultaneously. See live cursors, selections, and presence for every collaborator — powered by Yjs CRDT.",
    icon: Users2,
    iconBackground: "rgba(124,58,237,0.3)"
  },
  {
    title: "AI diagram generation",
    description:
      "Describe a flowchart in plain English. AI generates a full Excalidraw diagram in seconds using Groq's llama-3.3-70b model.",
    icon: Sparkles,
    iconBackground: "rgba(6,182,212,0.25)"
  },
  {
    title: "Excalidraw diagrams",
    description:
      "Draw freeform diagrams directly inside your documents. Embed as many diagram blocks as you need — each one is fully collaborative.",
    icon: PenTool,
    iconBackground: "rgba(16,185,129,0.25)"
  },
  {
    title: "Rich text editing",
    description:
      "Headings, lists, code blocks, and more — powered by Tiptap. Formatting that stays out of your way.",
    icon: FileText,
    iconBackground: "rgba(245,158,11,0.25)"
  },
  {
    title: "Persistent history",
    description:
      "Every keystroke is saved. Your documents persist across sessions with Yjs binary state stored in Supabase.",
    icon: History,
    iconBackground: "rgba(239,68,68,0.25)"
  },
  {
    title: "Secure sharing",
    description:
      "Share documents via link. Auth-protected routes ensure only the right people see your work.",
    icon: Lock,
    iconBackground: "rgba(236,72,153,0.25)"
  }
];

export function Features() {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const cards = Array.from(containerRef.current?.querySelectorAll<HTMLElement>(".feature-card") ?? []);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section id="features" ref={containerRef} className="bg-[#080812] px-4 py-24 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] uppercase tracking-[0.1em] text-violet-500">What&apos;s inside</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold text-white">Built for how teams actually work</h2>
          <p className="mx-auto mt-3 max-w-[500px] text-white/50">
            Collaboration, rich editing, and AI-assisted diagrams in one workspace.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: feature.iconBackground }}
              >
                <feature.icon className="h-[22px] w-[22px] text-white" />
              </div>

              <h3 className="mt-4 text-[1.05rem] font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-[0.9rem] leading-[1.6] text-white/50">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
