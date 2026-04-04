import { redirect } from "next/navigation";

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
        <DocumentList documents={documents} workspaceId={publicEnv.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID} />
      </section>
    </AppShell>
  );
}
