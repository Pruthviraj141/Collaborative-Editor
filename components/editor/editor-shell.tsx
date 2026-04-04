"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnyExtension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { Check, Copy, Download, Save, Share2 } from "lucide-react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { jsPDF } from "jspdf";

import { ActiveCollaborators } from "@/components/editor/active-collaborators";
import { EditorFloatingToolbar } from "@/components/editor/editor-floating-toolbar";
import { AiDiagramModal } from "@/components/editor/ai-diagram-modal";
import { EditorQuickInsert } from "@/components/editor/editor-quick-insert";
import { EditorStatus } from "@/components/editor/editor-status";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollaboration } from "@/hooks/use-collaboration";
import { getDiagramContent } from "@/lib/collab/diagram-state";
import type { DiagramTemplateKey } from "@/lib/diagram/templates";
import { DiagramNode } from "@/lib/editor/extensions/diagram-node";
import { useDocument } from "@/hooks/use-document";
import { useEditorState } from "@/hooks/use-editor-state";
import { publicEnv } from "@/lib/env";
import { safeUuid } from "@/lib/utils";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

interface EditorShellProps {
  documentId?: string;
  canWrite: boolean;
  canSaveMetadata?: boolean;
}

function extractNodeText(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  const typedNode = node as { text?: string; content?: unknown[] };

  if (typeof typedNode.text === "string") {
    return typedNode.text;
  }

  if (!Array.isArray(typedNode.content)) {
    return "";
  }

  return typedNode.content.map((child) => extractNodeText(child)).join("");
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadImageSize(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);
  return copied;
}

export function EditorShell({ documentId, canWrite, canSaveMetadata = false }: EditorShellProps) {
  const { document, isLoading, isSaving, error: documentError, save } = useDocument(documentId);
  const collaboration = useCollaboration({ documentId, canWrite });
  const slashGuardRef = useRef(false);
  const titleRef = useRef("");
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualSaveState, setManualSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const seededFromHtmlRef = useRef(false);

  useEffect(() => {
    seededFromHtmlRef.current = false;
  }, [documentId]);

  const initialTitle = document?.title ?? publicEnv.NEXT_PUBLIC_EDITOR_DEFAULT_TITLE;
  const initialContent = document?.content ?? "";

  const { state, setTitle, setContent, setStatus, setIsDirty } = useEditorState(initialTitle, initialContent);
  titleRef.current = state.title;

  const canEdit = canWrite && collaboration.role !== "viewer";

  const shareUrl = useMemo(() => {
    if (!documentId) {
      return "";
    }

    if (typeof window !== "undefined") {
      return `${window.location.origin}/editor?docId=${documentId}`;
    }

    return `${publicEnv.NEXT_PUBLIC_APP_URL}/editor?docId=${documentId}`;
  }, [documentId]);

  const editorExtensions = useMemo(() => {
    const base: AnyExtension[] = [
      StarterKit.configure({
        history: collaboration.enabled ? false : {},
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder: "Start writing your document..."
      }),
      DiagramNode.configure({
        yDoc: collaboration.yDoc,
        canEdit
      })
    ];

    if (!collaboration.enabled || !collaboration.yDoc) {
      return base;
    }

    const withCollaboration: AnyExtension[] = [
      ...base,
      Collaboration.configure({
        document: collaboration.yDoc
      })
    ];

    if (collaboration.provider) {
      withCollaboration.push(
        CollaborationCursor.configure({
          provider: collaboration.provider,
          user: collaboration.self ?? {
            id: "local-user",
            name: "You",
            color: "#2563eb"
          }
        })
      );
    }

    return withCollaboration;
  }, [canEdit, collaboration.enabled, collaboration.provider, collaboration.self, collaboration.yDoc]);

  useEffect(() => {
    if (!document) {
      return;
    }

    setTitle(document.title);

    if (!collaboration.enabled) {
      setContent(document.content);
    }

    setIsDirty(false);
    setStatus(canEdit ? "saved" : "read-only");
  }, [canEdit, collaboration.enabled, document, setContent, setIsDirty, setStatus, setTitle]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: collaboration.enabled ? canEdit : canWrite,
      extensions: editorExtensions,
      content: collaboration.enabled ? undefined : state.content,
      onUpdate: ({ editor: instance }) => {
        const { selection } = instance.state;
        const parent = selection.$from.parent;

        if (selection.empty && parent.type.name === "paragraph") {
          const text = parent.textContent.trim().toLowerCase();
          if (text.startsWith("/")) {
            setSlashQuery(text.slice(1));
          } else {
            setSlashQuery(null);
          }
        } else {
          setSlashQuery(null);
        }

        if (!slashGuardRef.current) {
          const commandText = parent.textContent.trim().toLowerCase();

          if (selection.empty && parent.type.name === "paragraph" && commandText === "/diagram" && canEdit) {
            slashGuardRef.current = true;
            const blockStart = selection.from - selection.$from.parentOffset;
            const blockEnd = blockStart + parent.nodeSize;

            instance
              .chain()
              .focus()
              .deleteRange({ from: blockStart, to: blockEnd })
              .insertDiagram()
              .insertContent({ type: "paragraph" })
              .run();

            queueMicrotask(() => {
              slashGuardRef.current = false;
            });
            return;
          }
        }

        if (collaboration.enabled) {
          const firstLine = instance.state.doc.textBetween(0, instance.state.doc.content.size, "\n", "\n").split("\n")[0]?.trim() ?? "";
          const canAutoTitle = canSaveMetadata && (titleRef.current.trim() === "" || titleRef.current === publicEnv.NEXT_PUBLIC_EDITOR_DEFAULT_TITLE);

          if (canAutoTitle && firstLine.length > 0) {
            setTitle(firstLine.slice(0, 90));
            setIsDirty(true);
          }

          if (canEdit) {
            setStatus("syncing");
          }
          return;
        }

        const html = instance.getHTML();
        setContent(html);
        setIsDirty(true);

        const firstLine = instance.state.doc.textBetween(0, instance.state.doc.content.size, "\n", "\n").split("\n")[0]?.trim() ?? "";
        const canAutoTitle = canSaveMetadata && (titleRef.current.trim() === "" || titleRef.current === publicEnv.NEXT_PUBLIC_EDITOR_DEFAULT_TITLE);

        if (canAutoTitle && firstLine.length > 0) {
          setTitle(firstLine.slice(0, 90));
        }

        setStatus(canWrite ? "syncing" : "read-only");
      }
    },
    [collaboration.enabled, collaboration.yDoc, collaboration.provider, canEdit, canWrite]
  );

  const runSlashInsert = useCallback((command: "diagram" | DiagramTemplateKey) => {
    if (!editor || !canEdit) {
      return;
    }

    const { selection } = editor.state;
    const parent = selection.$from.parent;
    const blockStart = selection.from - selection.$from.parentOffset;
    const blockEnd = blockStart + parent.nodeSize;

    const chain = editor.chain().focus().deleteRange({ from: blockStart, to: blockEnd });

    if (command === "diagram") {
      chain.insertDiagram();
    } else {
      chain.insertDiagramTemplate(command);
    }

    chain.insertContent({ type: "paragraph" }).run();
    setSlashQuery(null);
  }, [canEdit, editor]);

  const onInsertAiDiagram = useCallback((elements: ExcalidrawElement[]) => {
    if (!editor || !canEdit) {
      return;
    }

    const blockId = safeUuid();

    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: "diagram",
          attrs: {
            blockId,
            templateKey: "blank",
            initialElements: JSON.stringify(elements)
          }
        },
        {
          type: "paragraph"
        }
      ])
      .run();
  }, [canEdit, editor]);

  const slashItems = useMemo(
    () => [
      { key: "diagram", label: "/diagram", action: () => runSlashInsert("diagram") },
      { key: "flowchart", label: "/flowchart", action: () => runSlashInsert("flowchart") },
      { key: "mindmap", label: "/mindmap", action: () => runSlashInsert("mindmap") },
      { key: "process", label: "/process", action: () => runSlashInsert("process") },
      { key: "system", label: "/system", action: () => runSlashInsert("system") }
    ],
    [runSlashInsert]
  );

  const filteredSlashItems = useMemo(() => {
    if (slashQuery === null) {
      return [];
    }

    if (slashQuery.length === 0) {
      return slashItems;
    }

    return slashItems.filter((item) => item.label.includes(slashQuery));
  }, [slashItems, slashQuery]);

  useEffect(() => {
    if (collaboration.enabled) {
      return;
    }

    if (!editor) {
      return;
    }

    if (editor.getHTML() !== state.content) {
      editor.commands.setContent(state.content, false);
    }
  }, [collaboration.enabled, editor, state.content]);

  useEffect(() => {
    if (!editor || !collaboration.enabled || !collaboration.isReady || collaboration.hasPersistedState) {
      return;
    }

    if (!document?.content || seededFromHtmlRef.current) {
      return;
    }

    const currentText = editor.getText().trim();
    if (currentText.length > 0) {
      return;
    }

    seededFromHtmlRef.current = true;
    editor.commands.setContent(document.content, false);
    setIsDirty(true);
    setStatus("syncing");
  }, [collaboration.enabled, collaboration.hasPersistedState, collaboration.isReady, document?.content, editor, setIsDirty, setStatus]);

  useEffect(() => {
    if (!canSaveMetadata || !documentId || !state.isDirty) {
      return;
    }

    let cancelled = false;

    const persist = async () => {
      const saved = await save({
        id: documentId,
        title: state.title,
        content: editor?.getHTML() ?? state.content
      });

      if (cancelled) {
        return;
      }

      if (saved) {
        setStatus("saved");
        setIsDirty(false);
      } else {
        setStatus("error");
      }
    };

    void persist();

    return () => {
      cancelled = true;
    };
  }, [canSaveMetadata, documentId, editor, save, setIsDirty, setStatus, state.content, state.isDirty, state.title]);

  const onManualSave = useCallback(async () => {
    if (!documentId || !canSaveMetadata) {
      return;
    }

    setManualSaveState("saving");

    const saved = await save(
      {
        id: documentId,
        title: state.title,
        content: editor?.getHTML() ?? state.content
      },
      { immediate: true }
    );

    if (saved) {
      setStatus("saved");
      setIsDirty(false);
      setManualSaveState("saved");
    } else {
      setStatus("error");
      setManualSaveState("idle");
      return;
    }

    setTimeout(() => setManualSaveState("idle"), 1200);
  }, [canSaveMetadata, documentId, editor, save, setIsDirty, setStatus, state.content, state.title]);

  const onDownloadPdf = useCallback(async () => {
    if (!editor || isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = margin;

      const ensureSpace = (height: number) => {
        if (cursorY + height <= pageHeight - margin) {
          return;
        }

        pdf.addPage();
        cursorY = margin;
      };

      const writeTextBlock = (text: string, options?: { heading?: boolean; bullet?: boolean }) => {
        const normalized = text.trim();

        if (!normalized) {
          return;
        }

        const prefix = options?.bullet ? "• " : "";
        const fontSize = options?.heading ? 16 : 11;
        const lineHeight = options?.heading ? 22 : 16;
        const lines = pdf.splitTextToSize(`${prefix}${normalized}`, contentWidth) as string[];
        const blockHeight = lines.length * lineHeight;

        ensureSpace(blockHeight + 6);

        pdf.setFont("helvetica", options?.heading ? "bold" : "normal");
        pdf.setFontSize(fontSize);
        pdf.text(lines, margin, cursorY);

        cursorY += blockHeight + 8;
      };

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      const title = (state.title || "Document").trim();
      writeTextBlock(title, { heading: true });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      writeTextBlock(`Exported ${new Date().toLocaleString()}`);
      cursorY += 8;

      const json = editor.getJSON() as {
        content?: Array<{
          type?: string;
          attrs?: { blockId?: string };
          content?: Array<{ type?: string; content?: Array<{ text?: string }>; text?: string }>;
        }>;
      };

      for (const block of json.content ?? []) {
        const blockType = block.type ?? "paragraph";

        if (blockType === "diagram") {
          const blockId = String(block.attrs?.blockId ?? "");
          const scene = blockId && collaboration.yDoc ? getDiagramContent(collaboration.yDoc, blockId) : null;

          if (scene && scene.elements.length > 0) {
            const { exportToBlob } = await import("@excalidraw/excalidraw");
            const blob = await exportToBlob({
              elements: scene.elements,
              appState: {
                ...scene.appState,
                exportBackground: true
              },
              files: scene.files,
              mimeType: "image/png"
            });

            const dataUrl = await blobToDataUrl(blob);
            const size = await loadImageSize(dataUrl);
            const targetWidth = contentWidth;
            const targetHeight = Math.max(160, Math.round((size.height / size.width) * targetWidth));

            ensureSpace(targetHeight + 18);
            pdf.addImage(dataUrl, "PNG", margin, cursorY, targetWidth, targetHeight, undefined, "FAST");
            cursorY += targetHeight + 14;
          }

          continue;
        }

        if (blockType === "heading") {
          writeTextBlock(extractNodeText(block), { heading: true });
          continue;
        }

        if (blockType === "bulletList" || blockType === "orderedList") {
          for (const item of block.content ?? []) {
            writeTextBlock(extractNodeText(item), { bullet: true });
          }
          cursorY += 2;
          continue;
        }

        if (blockType === "blockquote") {
          writeTextBlock(extractNodeText(block));
          continue;
        }

        writeTextBlock(extractNodeText(block));
      }

      pdf.save(`${title || "document"}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  }, [collaboration.yDoc, editor, isExportingPdf, state.title]);

  const onCopyShareLink = useCallback(async () => {
    if (!shareUrl) {
      return;
    }

    try {
      const copied = await copyText(shareUrl);
      if (!copied) {
        return;
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op: clipboard may be blocked in insecure/non-permitted contexts
    }
  }, [shareUrl]);

  const resolvedStatus = useMemo(() => {
    if (!canEdit) {
      return "read-only" as const;
    }

    if (documentError) {
      return "error" as const;
    }

    if (collaboration.enabled) {
      if (collaboration.status === "reconnecting") {
        return "reconnecting" as const;
      }

      if (collaboration.status === "offline") {
        return "offline" as const;
      }

      if (state.status === "syncing") {
        return "syncing" as const;
      }

      return "connected" as const;
    }

    if (isSaving || state.status === "syncing") {
      return "syncing" as const;
    }

    return "saved" as const;
  }, [canEdit, collaboration.enabled, collaboration.status, documentError, isSaving, state.status]);

  const combinedError = documentError ?? collaboration.error;

  if (!documentId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">No document selected. Open a document from your dashboard.</p>
      </Card>
    );
  }

  if (!isLoading && !document && documentError) {
    const message = documentError.toLowerCase().includes("not found") ? "Document not found" : documentError;

    return (
      <Card className="p-6">
        <p className="text-sm font-medium text-destructive">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">Check the shared link or return to dashboard.</p>
      </Card>
    );
  }

  if (!editor && !isLoading) {
    if (collaboration.enabled && !collaboration.isReady) {
      return (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Connecting collaboration room...</p>
        </Card>
      );
    }

    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Editor failed to initialize. Please refresh.</p>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[280px] flex-1">
          <Input
            value={state.title}
            onChange={(event) => {
              setTitle(event.target.value);
              setIsDirty(true);
              setStatus(canEdit ? "syncing" : "read-only");
            }}
            disabled={!canSaveMetadata}
            className="h-11 max-w-xl border-none px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
            aria-label="Document title"
          />
        </div>

        <div className="flex items-center gap-3">
          {collaboration.enabled ? <ActiveCollaborators users={collaboration.collaborators} /> : null}
          <EditorStatus status={resolvedStatus} />
        </div>
      </div>

      {editor ? <EditorToolbar editor={editor} canWrite={canEdit} onAiDiagram={() => setAiModalOpen(true)} /> : null}

      {editor ? (
        <div className="flex items-center justify-between">
          <EditorQuickInsert editor={editor} canWrite={canEdit} />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsShareOpen(true)}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void onManualSave()} disabled={!canSaveMetadata || isSaving || manualSaveState === "saving"}>
              <Save className="h-4 w-4" />
              {manualSaveState === "saving" ? "Saving..." : manualSaveState === "saved" ? "Saved" : "Save"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void onDownloadPdf()} disabled={isExportingPdf}>
              <Download className="h-4 w-4" />
              {isExportingPdf ? "Exporting..." : "Download PDF"}
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="min-h-[65vh] border border-border/80 bg-white/80 p-6 md:p-10">
        {filteredSlashItems.length > 0 ? (
          <div className="mb-4 max-w-xs rounded-lg border border-border/80 bg-background/95 p-1 shadow-sm">
            {filteredSlashItems.map((item) => (
              <Button key={item.key} type="button" variant="ghost" className="h-8 w-full justify-start text-xs" onClick={item.action}>
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}
        {combinedError ? <p className="mb-4 text-sm text-destructive">{combinedError}</p> : null}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : (
          <EditorContent editor={editor} className="tiptap-shell" />
        )}
      </Card>

      {editor ? <EditorFloatingToolbar editor={editor} canWrite={canEdit} /> : null}

      <AiDiagramModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onInsert={onInsertAiDiagram}
        docId={documentId}
      />

      {isShareOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setIsShareOpen(false)}>
          <Card className="w-full max-w-lg rounded-2xl p-4 shadow-lg" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Share document</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsShareOpen(false)}>
                Close
              </Button>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">Users must log in before accessing this shared link.</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="font-mono text-xs" />
              <Button type="button" onClick={() => void onCopyShareLink()}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p
              className={`mt-2 text-xs font-medium text-emerald-600 transition-all duration-200 ${
                copied ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
              }`}
            >
              Copied!
            </p>
          </Card>
        </div>
      ) : null}
    </section>
  );
}