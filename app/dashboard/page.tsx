import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CreateDocumentButton } from "@/components/documents/create-document-button";
import { DocumentList } from "@/components/documents/document-list";
import { AppShell } from "@/components/layout/app-shell";
import { listDocuments } from "@/lib/db/documents";
import { publicEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient();
  const user = await supabase.auth.getUser().then(({ data }) => data.user).catch(() => null);

  if (!user) {
    redirect("/auth?next=%2Fdashboard");
  }

  const documents = await listDocuments(supabase, {
    userId: user.id,
    workspaceId: publicEnv.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID
  }).catch(() => []);

  return (
    <AppShell>
      <section className="mb-8 flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Your Documents</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">Create, edit and collaborate with confidence.</p>
        </div>
        <CreateDocumentButton workspaceId={publicEnv.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID} />
      </section>

      <section>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            </div>
          }
        >
          <DocumentList documents={documents} workspaceId={publicEnv.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID} />
        </Suspense>
      </section>
    </AppShell>
  );
}
