import { AppShell } from "@/components/layout/app-shell";
import { EditorShell } from "@/components/editor/editor-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface EditorPageProps {
  searchParams: {
    docId?: string;
    document?: string;
  };
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const documentId = searchParams.docId ?? searchParams.document;
  const supabase = getSupabaseServerClient();
  const user = await supabase.auth.getUser().then(({ data }) => data.user).catch(() => null);

  if (!user) {
    const backTo = `/editor${documentId ? `?docId=${encodeURIComponent(documentId)}` : ""}`;
    redirect(`/auth?next=${encodeURIComponent(backTo)}`);
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Editor</h1>
          <p className="text-sm text-muted-foreground">A focused writing experience with collaboration-ready architecture.</p>
        </div>
        <Badge variant="success">Write access</Badge>
      </div>
      <Suspense
        fallback={
          <section className="space-y-4">
            <div className="loading-progress h-1 w-full rounded-full bg-muted/70" />
            <Card className="space-y-3 p-6">
              <div className="skeleton h-8 w-72 rounded-md" />
              <div className="skeleton h-4 w-80 max-w-full rounded-md" />
              <div className="skeleton h-56 w-full rounded-xl" />
            </Card>
          </section>
        }
      >
        <EditorShell documentId={documentId} canWrite={true} canSaveMetadata={true} />
      </Suspense>
    </AppShell>
  );
}