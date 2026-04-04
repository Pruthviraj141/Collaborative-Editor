const steps = [
  {
    title: "Create a document",
    description: "Open your workspace, click New Document. Done. You're editing."
  },
  {
    title: "Invite your team",
    description: "Share the document link. Anyone with the link can join and edit instantly."
  },
  {
    title: "Build with AI",
    description: "Type /diagram or use the AI toolbar. Describe what you need — AI draws it."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#0d0d1f] px-4 py-24 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="text-center text-[clamp(2rem,4vw,3rem)] font-bold text-white">How it works</h2>

        <div className="relative mt-12 space-y-8 md:space-y-10">
          <div className="absolute bottom-6 left-5 top-6 hidden border-l border-dashed border-violet-400/35 md:block" aria-hidden="true" />

          {steps.map((step, index) => (
            <article key={step.title} className="relative flex gap-4 md:gap-6">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-400/40 text-sm font-semibold text-violet-300">
                {index + 1}
              </div>
              <div>
                <h3 className="text-[1.1rem] font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-white/55">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
