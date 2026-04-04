import { DatabaseError } from "@/lib/db/documents";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DocumentYjsStateRecord } from "@/types/document";

export async function getYjsState(documentId: string, client: ReturnType<typeof getSupabaseServerClient>) {
  const { data, error } = await client
    .schema("public")
    .from("document_yjs_state")
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError("Unable to fetch yjs state", 500);
  }

  return (data ?? null) as DocumentYjsStateRecord | null;
}

export async function upsertYjsState(
  input: {
    documentId: string;
    yjsStateBase64: string;
    htmlSnapshot: string | null;
    actorId?: string | null;
  },
  client: ReturnType<typeof getSupabaseServerClient>
) {
  const { data: current } = await client
    .schema("public")
    .from("document_yjs_state")
    .select("version")
    .eq("document_id", input.documentId)
    .maybeSingle();

  const nextVersion = (current?.version ?? 0) + 1;

  const { error } = await client.schema("public").from("document_yjs_state").upsert(
    {
      document_id: input.documentId,
      yjs_state_base64: input.yjsStateBase64,
      html_snapshot: input.htmlSnapshot,
      updated_by: input.actorId ?? null,
      version: nextVersion,
      updated_at: new Date().toISOString()
    },
    { onConflict: "document_id" }
  );

  if (error) {
    throw new DatabaseError("Unable to save yjs state", 500);
  }

  return nextVersion;
}

export async function createYjsVersion(
  input: {
    documentId: string;
    versionNumber: number;
    yjsStateBase64: string;
    htmlSnapshot: string | null;
    actorId?: string | null;
  },
  client: ReturnType<typeof getSupabaseServerClient>
) {
  const { error } = await client.schema("public").from("document_yjs_versions").insert({
    document_id: input.documentId,
    version_number: input.versionNumber,
    yjs_state_base64: input.yjsStateBase64,
    html_snapshot: input.htmlSnapshot,
    created_by: input.actorId ?? null
  });

  if (error) {
    throw new DatabaseError("Unable to create yjs version", 500);
  }
}
