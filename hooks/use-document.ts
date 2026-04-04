"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/constants/editor";
import type { DocumentRecord } from "@/types/document";

interface UseDocumentResult {
  document: DocumentRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  save: (input: { id: string; title?: string; content?: string }, options?: { immediate?: boolean }) => Promise<boolean>;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Unexpected request error");
  }

  return (await response.json()) as T;
}

export function useDocument(documentId?: string): UseDocumentResult {
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(documentId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(async () => {
    if (!documentId) {
      setDocument(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseResponse<{ document: DocumentRecord }>(
        await fetch(`/api/documents/${documentId}`, { cache: "no-store" })
      );
      setDocument(data.document);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load document");
      setDocument(null);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const save = useCallback(async (input: { id: string; title?: string; content?: string }, options?: { immediate?: boolean }) => {
    setIsSaving(true);
    setError(null);

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    const persist = async () => {
      try {
        const data = await parseResponse<{ document: DocumentRecord }>(
          await fetch(`/api/documents/${input.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ title: input.title, content: input.content })
          })
        );
        setDocument(data.document);
        return true;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to save changes");
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    if (options?.immediate) {
      return await persist();
    }

    return await new Promise<boolean>((resolve) => {
      saveTimer.current = setTimeout(() => {
        void persist().then(resolve);
      }, AUTOSAVE_DEBOUNCE_MS);
    });
  }, []);

  return {
    document,
    isLoading,
    isSaving,
    error,
    refetch,
    save
  };
}