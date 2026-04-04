"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AiDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (elements: ExcalidrawElement[]) => void;
  docId: string;
}

const MAX_PROMPT = 500;

export function AiDiagramModal({ isOpen, onClose, onInsert, docId }: AiDiagramModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canGenerate = useMemo(() => {
    return !loading && prompt.trim().length > 0 && prompt.length <= MAX_PROMPT;
  }, [loading, prompt]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);
    const timer = setTimeout(() => textareaRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const root = modalRef.current;
      if (!root) {
        return;
      }

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-diagram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          docId
        })
      });

      const data = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            error?: string;
            elements?: ExcalidrawElement[];
          }
        | null;

      if (!response.ok || !data?.success || !Array.isArray(data.elements)) {
        throw new Error(data?.error ?? "Generation failed. Please try again.");
      }

      onInsert(data.elements);
      onClose();
      setPrompt("");
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [canGenerate, docId, onClose, onInsert, prompt]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
      role="presentation"
    >
      <Card
        ref={modalRef}
        className="w-full max-w-[520px] rounded-2xl p-8 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Generate diagram with AI"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 className="mb-3 text-lg font-semibold">Generate diagram with AI</h3>

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value.slice(0, MAX_PROMPT))}
          rows={5}
          placeholder="Describe the diagram — e.g. 'User authentication flow with JWT and refresh tokens'"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          disabled={loading}
          maxLength={MAX_PROMPT}
        />

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{prompt.length}/{MAX_PROMPT} chars</span>
          <span>Powered by Groq · llama-3.3-70b-versatile</span>
        </div>

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleGenerate()} disabled={!canGenerate}>
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
