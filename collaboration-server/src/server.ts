import { Server } from "@hocuspocus/server";
import * as Y from "yjs";

import { canWrite, verifyCollabToken } from "./auth.js";
import { collabEnv } from "./env.js";
import { flushDocument, loadYDoc, schedulePersist } from "./persistence/supabase.js";
import type { CollabTokenPayload } from "./types.js";

interface ConnectionContext {
  user: CollabTokenPayload;
}

const inMemoryDocs = new Map<string, Y.Doc>();
const changeCounts = new Map<string, number>();

function getDocumentFromMemory(name: string) {
  const existing = inMemoryDocs.get(name);
  if (existing) {
    return existing;
  }

  const created = new Y.Doc();
  inMemoryDocs.set(name, created);
  return created;
}

const server = Server.configure({
  name: "writerflow-collaboration-server",
  port: collabEnv.HOCUSPOCUS_PORT,
  address: collabEnv.HOCUSPOCUS_HOST,
  timeout: 30000,
  debounce: collabEnv.COLLAB_UPDATE_FLUSH_MS,
  maxDebounce: Math.max(collabEnv.COLLAB_UPDATE_FLUSH_MS * 3, 7000),
  async onAuthenticate(data) {
    const token = typeof data.token === "string" ? data.token : "";

    const user = await verifyCollabToken(token);
    if (user.documentId !== data.documentName) {
      throw new Error("Token does not match requested document room");
    }

    console.log(`[collab] authenticate: doc=${data.documentName} user=${user.userId} role=${user.role}`);

    data.connection.readOnly = !canWrite(user.role);
    data.connection.requiresAuthentication = true;

    data.context = {
      user
    } satisfies ConnectionContext;
  },
  async onLoadDocument(data) {
    const documentId = data.documentName;

    if (collabEnv.COLLAB_DISABLE_PERSISTENCE) {
      console.log(`[collab] load (memory): doc=${documentId}`);
      return getDocumentFromMemory(documentId);
    }

    try {
      const loaded = await loadYDoc(documentId);
      inMemoryDocs.set(documentId, loaded);
      console.log(`[collab] load (db): doc=${documentId}`);
      return loaded;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown load error";
      console.error(`[collab] load failed for ${documentId}: ${message}`);
      const fallback = getDocumentFromMemory(documentId);
      return fallback;
    }
  },
  async onConnect(data) {
    console.log(`[collab] connected: doc=${data.documentName}`);
  },
  async onDisconnect(data) {
    console.log(`[collab] disconnected: doc=${data.documentName}`);
  },
  async onChange(data) {
    const changeCount = (changeCounts.get(data.documentName) ?? 0) + 1;
    changeCounts.set(data.documentName, changeCount);
    const size = Y.encodeStateAsUpdate(data.document).byteLength;

    if (changeCount <= 5 || changeCount % 20 === 0) {
      console.log(`[collab] change: doc=${data.documentName} count=${changeCount} bytes=${size} at=${new Date().toISOString()}`);
    }

    if (collabEnv.COLLAB_DISABLE_PERSISTENCE) {
      return;
    }

    const context = data.context as ConnectionContext | undefined;
    schedulePersist({
      documentId: data.documentName,
      document: data.document,
      actorId: context?.user.userId ?? null,
      htmlSnapshot: null
    });
  },
  async onStoreDocument(data) {
    if (collabEnv.COLLAB_DISABLE_PERSISTENCE) {
      return;
    }

    const context = data.context as ConnectionContext | undefined;

    await flushDocument(data.documentName, data.document, context?.user.userId ?? null, null);
  },
  async onUpgrade(data) {
    if (!data.request.url) {
      throw new Error("Missing upgrade request URL");
    }
  }
});

server.listen();

console.log(`[collab] listening on ws://${collabEnv.HOCUSPOCUS_HOST}:${collabEnv.HOCUSPOCUS_PORT}`);
