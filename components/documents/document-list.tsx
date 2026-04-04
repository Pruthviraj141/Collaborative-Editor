import Link from "next/link";
import { FileText, Clock3 } from "lucide-react";

import { CreateDocumentButton } from "@/components/documents/create-document-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentRecord } from "@/types/document";

interface DocumentListProps {
  documents: DocumentRecord[];
  workspaceId: string;
}

export function DocumentList({ documents, workspaceId }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <Card className="rounded-2xl border border-border/70 shadow-sm">
        <CardHeader className="items-center py-12 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <CardTitle>No documents yet</CardTitle>
          <CardDescription>Create your first document to start collaborating.</CardDescription>
          <div className="pt-3">
            <CreateDocumentButton workspaceId={workspaceId} />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Recent documents</CardTitle>
        <CardDescription>Pick up where you left off.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2">
        {documents.map((doc) => (
          <Link
            key={doc.id}
            href={`/editor?docId=${doc.id}`}
            className="group rounded-xl border border-border/70 bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-border hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                Edited
              </span>
            </div>
            <p className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">{doc.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(doc.updated_at).toLocaleString()}</p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}