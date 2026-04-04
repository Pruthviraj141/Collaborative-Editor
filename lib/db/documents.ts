import { documentIdSchema } from "@/lib/validators/document";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DocumentRecord } from "@/types/document";

export class DatabaseError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function listDocuments(
  client: ReturnType<typeof getSupabaseServerClient>,
  args: { workspaceId?: string; userId?: string | null }
) {
  let query = client
    .schema("public")
    .from("documents")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(30)
    .eq("is_archived", false);

  if (args.workspaceId) {
    query = query.eq("workspace_id", args.workspaceId);
  }

  if (args.userId) {
    query = query.or(`owner_id.eq.${args.userId},last_edited_by.eq.${args.userId}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError("Unable to fetch documents", 500);
  }

  return data satisfies DocumentRecord[];
}

export async function getDocumentById(client: ReturnType<typeof getSupabaseServerClient>, id: string) {
  const parsed = documentIdSchema.safeParse(id);
  if (!parsed.success) {
    throw new DatabaseError("Invalid document id", 400);
  }

  const { data, error } = await client
    .schema("public")
    .from("documents")
    .select("*")
    .eq("id", parsed.data)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new DatabaseError("Document not found", 404);
    }

    throw new DatabaseError("Unable to fetch document", 500);
  }

  return data satisfies DocumentRecord;
}

export async function createDocument(
  client: ReturnType<typeof getSupabaseServerClient>,
  input: {
    title: string;
    content: string;
    ownerId: string;
    workspaceId: string;
  }
) {
  const { data, error } = await client
    .schema("public")
    .from("documents")
    .insert({
      title: input.title,
      content: input.content,
      owner_id: input.ownerId,
      workspace_id: input.workspaceId,
      last_edited_by: input.ownerId
    })
    .select("*")
    .single();

  if (error) {
    throw new DatabaseError("Unable to create document", 500);
  }

  return data satisfies DocumentRecord;
}

export async function updateDocumentMeta(
  client: ReturnType<typeof getSupabaseServerClient>,
  input: {
    id: string;
    title?: string;
    content?: string;
    isArchived?: boolean;
    actorId: string;
  }
) {
  const parsed = documentIdSchema.safeParse(input.id);
  if (!parsed.success) {
    throw new DatabaseError("Invalid document id", 400);
  }

  const updatePayload: {
    title?: string;
    content?: string;
    is_archived?: boolean;
    last_edited_by: string;
    updated_at: string;
  } = {
    last_edited_by: input.actorId,
    updated_at: new Date().toISOString()
  };

  if (typeof input.title === "string") {
    updatePayload.title = input.title;
  }

  if (typeof input.content === "string") {
    updatePayload.content = input.content;
  }

  if (typeof input.isArchived === "boolean") {
    updatePayload.is_archived = input.isArchived;
  }

  const { data, error } = await client
    .schema("public")
    .from("documents")
    .update(updatePayload)
    .eq("id", parsed.data)
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new DatabaseError("Document not found", 404);
    }

    throw new DatabaseError("Unable to update document", 500);
  }

  return data satisfies DocumentRecord;
}

export async function createVersion(
  client: ReturnType<typeof getSupabaseServerClient>,
  input: {
    documentId: string;
    contentSnapshot: string;
    createdBy: string;
    versionNumber: number;
  }
) {
  const { error } = await client.schema("public").from("document_versions").insert({
    document_id: input.documentId,
    content_snapshot: input.contentSnapshot,
    created_by: input.createdBy,
    version_number: input.versionNumber
  });

  if (error) {
    throw new DatabaseError("Unable to create document version", 500);
  }
}