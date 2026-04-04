"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

import { createPresence } from "@/lib/collab/presence";
import { publicEnv } from "@/lib/env";
import { safeUuid } from "@/lib/utils";
import type { CollaboratorPresence, EditorSyncStatus } from "@/types/editor";

type CollaborationStatus = Extract<EditorSyncStatus, "connected" | "reconnecting" | "offline" | "syncing" | "error">;

interface UseCollaborationInput {
  documentId?: string;
  canWrite: boolean;
}

interface UseCollaborationResult {
  enabled: boolean;
  isReady: boolean;
  hasPersistedState: boolean;
  provider: HocuspocusProvider | null;
  yDoc: Y.Doc | null;
  status: CollaborationStatus;
  collaborators: CollaboratorPresence[];
  self: CollaboratorPresence | null;
  error: string | null;
  role: "editor" | "viewer";
}

const SESSION_KEY = "writerflow-collab-session-id";

function decodeBase64ToUint8Array(base64: string) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return bytes;
}

function encodeUint8ArrayToBase64(input: Uint8Array) {
  let binary = "";

  for (let index = 0; index < input.length; index += 1) {
    binary += String.fromCharCode(input[index]);
  }

  return window.btoa(binary);
}

function resolveSessionSeed() {
  if (typeof window === "undefined") {
    return safeUuid();
  }

  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const next = safeUuid();
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

export function useCollaboration({ documentId, canWrite }: UseCollaborationInput): UseCollaborationResult {
  const [status, setStatus] = useState<CollaborationStatus>("offline");
  const [isReady, setIsReady] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [hasPersistedState, setHasPersistedState] = useState(false);
  const [role, setRole] = useState<"editor" | "viewer">(canWrite ? "editor" : "viewer");
  const [self, setSelf] = useState<CollaboratorPresence | null>(null);

  const sessionSeedRef = useRef<string | null>(null);

  const enabled = useMemo(() => {
    return Boolean(documentId && publicEnv.NEXT_PUBLIC_HOCUSPOCUS_URL);
  }, [documentId]);

  useEffect(() => {
    if (!enabled || !documentId) {
      setIsReady(false);
      setStatus("offline");
      setProvider(null);
      setYDoc(null);
      setHasPersistedState(false);
      setCollaborators([]);
      setSelf(null);
      setError(null);
      return;
    }

    let disposed = false;
    let localProvider: HocuspocusProvider | null = null;
    const localDoc = new Y.Doc();
    let persistTimer: ReturnType<typeof setTimeout> | null = null;
    let isHydrating = false;
    let scheduleFallbackPersist: (() => void) | null = null;

    const initialize = async () => {
      try {
        setStatus("reconnecting");
        setError(null);
        setIsReady(false);

        if (!sessionSeedRef.current) {
          sessionSeedRef.current = resolveSessionSeed();
        }

        const persistedStateResponse = await fetch(`/api/documents/${encodeURIComponent(documentId)}/yjs-state`, {
          cache: "no-store"
        });

        if (persistedStateResponse.ok) {
          const persistedState = (await persistedStateResponse.json()) as {
            hasState: boolean;
            yjsStateBase64: string | null;
            version: number | null;
          };

          setHasPersistedState(Boolean(persistedState.hasState && persistedState.yjsStateBase64));

          if (persistedState.hasState && persistedState.yjsStateBase64) {
            isHydrating = true;
            const update = decodeBase64ToUint8Array(persistedState.yjsStateBase64);
            Y.applyUpdate(localDoc, update);
            isHydrating = false;
          }

          if (process.env.NODE_ENV === "development") {
            const size = Y.encodeStateAsUpdate(localDoc).byteLength;
            console.info("[doc-load]", {
              documentId,
              hasState: persistedState.hasState,
              version: persistedState.version,
              yDocSize: size
            });
          }
        } else if (process.env.NODE_ENV === "development") {
          console.error("[doc-load] failed", {
            documentId,
            status: persistedStateResponse.status
          });
        }

        scheduleFallbackPersist = () => {
          if (!documentId || isHydrating) {
            return;
          }

          if (persistTimer) {
            clearTimeout(persistTimer);
          }

          persistTimer = setTimeout(async () => {
            try {
              const update = Y.encodeStateAsUpdate(localDoc);
              const yjsStateBase64 = encodeUint8ArrayToBase64(update);

              const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/yjs-state`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ yjsStateBase64 })
              });

              if (!response.ok && process.env.NODE_ENV === "development") {
                const body = (await response.json().catch(() => ({}))) as { error?: string };
                console.error("[doc-save] failed", {
                  documentId,
                  status: response.status,
                  error: body.error ?? "Unknown save error",
                  yDocSize: update.byteLength
                });
              }

              if (response.ok && process.env.NODE_ENV === "development") {
                console.info("[doc-save] ok", {
                  documentId,
                  yDocSize: update.byteLength,
                  at: new Date().toISOString()
                });
              }
            } catch {
              if (process.env.NODE_ENV === "development") {
                console.error("[doc-save] exception", { documentId });
              }
            }
          }, 2500);
        };

        localDoc.on("update", scheduleFallbackPersist);

        const tokenResponse = await fetch(`/api/collab/token?documentId=${encodeURIComponent(documentId)}`, {
          cache: "no-store"
        });

        if (!tokenResponse.ok) {
          throw new Error("Unable to create collaboration token");
        }

        const tokenData = (await tokenResponse.json()) as {
          token: string;
          role: "editor" | "viewer";
          user: {
            id: string;
            name: string | null;
          };
        };

        if (disposed) {
          return;
        }

        setRole(tokenData.role);

        const presence = createPresence(tokenData.user.id || sessionSeedRef.current, tokenData.user.name);
        setSelf(presence);

        localProvider = new HocuspocusProvider({
          url: publicEnv.NEXT_PUBLIC_HOCUSPOCUS_URL as string,
          name: documentId,
          document: localDoc,
          token: tokenData.token,
          preserveConnection: true,
          onConnect: () => {
            if (localProvider?.awareness) {
              localProvider.awareness.setLocalState({
                ...(localProvider.awareness.getLocalState() ?? {}),
                user: presence
              });
            }
            setStatus("connected");
            setError(null);
          },
          onDisconnect: () => {
            setStatus("reconnecting");
          },
          onStatus: ({ status: providerStatus }) => {
            if (providerStatus === "connected") {
              setStatus("connected");
              return;
            }

            if (providerStatus === "connecting") {
              setStatus("reconnecting");
              return;
            }

            setStatus("offline");
          },
          onSynced: () => {
            setStatus("syncing");
            setTimeout(() => {
              setStatus((current) => (current === "syncing" ? "connected" : current));
            }, 500);
          },
          onAuthenticationFailed: () => {
            setRole("viewer");
            setStatus("error");
            setError("Unable to join this document room");
          },
          onAwarenessUpdate: ({ states }) => {
            const next = [...states]
              .map((state) => state.user as { id?: string; name?: string; color?: string } | undefined)
              .filter(Boolean)
              .map((item) => ({
                id: item?.id ?? safeUuid(),
                name: item?.name ?? "Guest",
                color: item?.color ?? "#64748b"
              }));

            if (!next.some((item) => item.id === presence.id)) {
              next.push(presence);
            }

            const deduped = [...new Map(next.map((item) => [item.id, item])).values()];
            setCollaborators(deduped);
          }
        });

        if (localProvider.awareness) {
          localProvider.awareness.setLocalState({
            ...(localProvider.awareness.getLocalState() ?? {}),
            user: presence
          });
        }

        if (disposed) {
          localProvider.destroy();
          return;
        }

        setProvider(localProvider);
        setYDoc(localDoc);
        setIsReady(true);
      } catch {
        if (disposed) {
          return;
        }

        setStatus("offline");
        setError("Collaboration server unavailable. Working offline.");
        setProvider(null);
        setYDoc(localDoc);
        setHasPersistedState(false);
        setIsReady(true);
      }
    };

    void initialize();

    return () => {
      disposed = true;
      if (scheduleFallbackPersist) {
        localDoc.off("update", scheduleFallbackPersist);
      }
      if (persistTimer) {
        clearTimeout(persistTimer);
      }
      if (localProvider) {
        localProvider.destroy();
      }
      localDoc.destroy();
    };
  }, [enabled, documentId]);

  return {
    enabled,
    isReady,
    hasPersistedState,
    provider,
    yDoc,
    status,
    collaborators,
    self,
    error,
    role
  };
}
