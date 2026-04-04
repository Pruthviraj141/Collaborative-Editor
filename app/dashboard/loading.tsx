import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <AppShell>
      <section className="mb-8 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="skeleton h-7 w-56 rounded-md" />
        <div className="skeleton mt-3 h-4 w-80 max-w-full rounded-md" />
      </section>

      <Card className="rounded-2xl border border-border/70 shadow-sm">
        <CardHeader>
          <div className="skeleton h-6 w-44 rounded-md" />
          <div className="skeleton mt-2 h-4 w-56 rounded-md" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border/70 bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="skeleton h-9 w-9 rounded-lg" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-4 w-3/4 rounded-md" />
              <div className="skeleton mt-2 h-3 w-1/2 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
