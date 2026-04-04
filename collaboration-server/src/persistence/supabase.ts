import { createClient } from "@supabase/supabase-js";
import * as Y from "yjs";

import { collabEnv } from "../env.js";

interface DocumentStateRow {
  document_id: string;
  yjs_state_base64: string;
  html_snapshot: string | null;
  version: number;
}

const supabase = createClient(collabEnv.SUPABASE_URL, collabEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const pendingFlush = new Map<string, ReturnType<typeof setTimeout>>();
const flushCounters = new Map<string, number>();

function parseState(base64: string) {
  if (!base64) {
    return null;
  }

  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function serializeState(document: Y.Doc) {
  const update = Y.encodeStateAsUpdate(document);
  return Buffer.from(update).toString("base64");
}

export async function loadDocumentState(documentId: string) {
  const { data, error } = await supabase
    .schema("public")
    .from("document_yjs_state")
    .select("document_id,yjs_state_base64,html_snapshot,version")
    .eq("document_id", documentId)
    .maybeSingle<DocumentStateRow>();

  if (error) {
    throw new Error(`Unable to load document state: ${error.message}`);
  }

  return data ?? null;
}

export async function loadYDoc(documentId: string) {
  const doc = new Y.Doc();
  const state = await loadDocumentState(documentId);

  if (!state?.yjs_state_base64) {
    console.log(`[collab] load-state: doc=${documentId} state=empty at=${new Date().toISOString()}`);
    return doc;
  }

  const parsed = parseState(state.yjs_state_base64);
  if (parsed) {
    Y.applyUpdate(doc, parsed);
    console.log(`[collab] load-state: doc=${documentId} bytes=${parsed.byteLength} version=${state.version} at=${new Date().toISOString()}`);
  }

  return doc;
}

export async function persistYDoc(input: {
  documentId: string;
  document: Y.Doc;
  actorId?: string | null;
  htmlSnapshot: string | null;
}) {
  const yjsStateBase64 = serializeState(input.document);
  const stateBytes = Buffer.from(yjsStateBase64, "base64").byteLength;

  const { data: current, error: currentError } = await supabase
    .schema("public")
    .from("document_yjs_state")
    .select("version")
    .eq("document_id", input.documentId)
    .maybeSingle<{ version: number }>();

  if (currentError) {
    throw new Error(`Unable to fetch current yjs version: ${currentError.message}`);
  }

  const nextVersion = (current?.version ?? 0) + 1;

  const { error } = await supabase.schema("public").from("document_yjs_state").upsert(
    {
      document_id: input.documentId,
      yjs_state_base64: yjsStateBase64,
      html_snapshot: input.htmlSnapshot,
      updated_by: input.actorId ?? null,
      version: nextVersion,
      updated_at: new Date().toISOString()
    },
    { onConflict: "document_id" }
  );

  if (error) {
    throw new Error(`Unable to persist yjs state: ${error.message}`);
  }

  console.log(`[collab] save-state: doc=${input.documentId} bytes=${stateBytes} version=${nextVersion} at=${new Date().toISOString()}`);

  const updateTick = (flushCounters.get(input.documentId) ?? 0) + 1;
  flushCounters.set(input.documentId, updateTick);

  if (updateTick % collabEnv.COLLAB_VERSION_INTERVAL === 0) {
    const { error: versionError } = await supabase.schema("public").from("document_yjs_versions").insert({
      document_id: input.documentId,
      version_number: nextVersion,
      yjs_state_base64: yjsStateBase64,
      html_snapshot: input.htmlSnapshot,
      created_by: input.actorId ?? null
    });

    if (versionError) {
      throw new Error(`Unable to persist yjs version: ${versionError.message}`);
    }
  }

  return {
    version: nextVersion,
    yjsStateBase64
  };
}

export function schedulePersist(input: {
  documentId: string;
  document: Y.Doc;
  actorId?: string | null;
  htmlSnapshot: string | null;
}) {
  const existing = pendingFlush.get(input.documentId);
  if (existing) {
    clearTimeout(existing);
  }

  const timeout = setTimeout(async () => {
    pendingFlush.delete(input.documentId);

    try {
      await persistYDoc(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown persistence error";
      console.error(`[collab] persist failed for document ${input.documentId}: ${message}`);
    }
  }, collabEnv.COLLAB_UPDATE_FLUSH_MS);

  pendingFlush.set(input.documentId, timeout);
}

export async function flushDocument(documentId: string, document: Y.Doc, actorId?: string | null, htmlSnapshot: string | null = null) {
  const pending = pendingFlush.get(documentId);
  if (pending) {
    clearTimeout(pending);
    pendingFlush.delete(documentId);
  }

  await persistYDoc({
    documentId,
    document,
    actorId,
    htmlSnapshot
  });
}
