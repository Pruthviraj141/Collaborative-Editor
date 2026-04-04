import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function EditorLoading() {
  return (
    <AppShell>
      <div className="loading-progress mb-4 h-1 w-full rounded-full bg-muted/70" />
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="skeleton h-10 w-72 rounded-md" />
          <div className="skeleton h-7 w-24 rounded-full" />
        </div>

        <div className="skeleton h-12 w-full rounded-xl" />

        <Card className="min-h-[65vh] border border-border/80 bg-white/80 p-6 md:p-10">
          <div className="space-y-3">
            <div className="skeleton h-5 w-1/3 rounded-md" />
            <div className="skeleton h-4 w-2/3 rounded-md" />
            <div className="skeleton h-4 w-1/2 rounded-md" />
            <div className="skeleton h-4 w-3/4 rounded-md" />
            <div className="skeleton h-52 w-full rounded-xl" />
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
