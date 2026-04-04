"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Copy, Download, Expand, FileImage, FileType2, LocateFixed, PenSquare, Plus, RefreshCw, Settings2, Trash2, Type } from "lucide-react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import type * as Y from "yjs";

import { DiagramCanvas } from "@/components/diagram/diagram-canvas";
import { DIAGRAM_ORIGINS, getDiagramContent, setDiagramContent } from "@/lib/collab/diagram-state";
import { alignElements, distributeElements, enrichArrowBindings, extractArrowConnections } from "@/lib/diagram/arrow-bindings";
import { DIAGRAM_TEMPLATES, getDiagramTemplate, type DiagramTemplateKey } from "@/lib/diagram/templates";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DEFAULT_DIAGRAM_LAYOUT_SETTINGS, type DiagramLayoutSettings } from "@/types/diagram";

interface DiagramNodeViewProps {
  props: NodeViewProps;
  yDoc: Y.Doc | null;
  canEdit: boolean;
}

export function DiagramNodeView({ props, yDoc, canEdit }: DiagramNodeViewProps) {
  const blockId = String(props.node.attrs.blockId ?? "");
  const templateKey = String(props.node.attrs.templateKey ?? "blank") as DiagramTemplateKey;
  const initialElements = typeof props.node.attrs.initialElements === "string" ? props.node.attrs.initialElements : null;
  const shellRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const wrapperClassName = useMemo(() => {
    return ["diagram-node my-4", props.selected ? "is-selected" : ""]
      .filter(Boolean)
      .join(" ");
  }, [props.selected]);

  const getCurrentLayoutSettings = useCallback((): DiagramLayoutSettings => {
    const scene = yDoc ? getDiagramContent(yDoc, blockId) : null;
    return {
      ...DEFAULT_DIAGRAM_LAYOUT_SETTINGS,
      ...(scene?.metadata?.layoutSettings ?? {})
    };
  }, [blockId, yDoc]);

  const handleDuplicate = useCallback(() => {
    if (!canEdit || !yDoc) {
      return;
    }

    const position = typeof props.getPos === "function" ? props.getPos() : null;
    if (typeof position !== "number") {
      return;
    }

    const newBlockId = crypto.randomUUID();
    const sourceScene = getDiagramContent(yDoc, blockId);

    setDiagramContent(
      yDoc,
      newBlockId,
      sourceScene
        ? {
            elements: sourceScene.elements,
            appState: sourceScene.appState,
            files: sourceScene.files,
            metadata: {
              updatedAt: new Date().toISOString(),
              layoutSettings: sourceScene.metadata?.layoutSettings ?? getCurrentLayoutSettings(),
              arrowConnections: sourceScene.metadata?.arrowConnections ?? extractArrowConnections(sourceScene.elements)
            }
          }
        : {
            elements: [],
            appState: {},
            files: {},
            metadata: {
              updatedAt: new Date().toISOString(),
              layoutSettings: getCurrentLayoutSettings(),
              arrowConnections: {}
            }
          },
      DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW
    );

    props.editor
      .chain()
      .focus(position + props.node.nodeSize)
      .insertContent({
        type: "diagram",
        attrs: {
          blockId: newBlockId
        }
      })
      .insertContent({ type: "paragraph" })
      .run();
  }, [blockId, canEdit, getCurrentLayoutSettings, props, yDoc]);

  const handleCopyAsImage = useCallback(async () => {
    if (!apiRef.current || !navigator.clipboard || typeof ClipboardItem === "undefined") {
      return;
    }

    const { exportToBlob } = await import("@excalidraw/excalidraw");
    const elements = apiRef.current.getSceneElements();
    const appState = apiRef.current.getAppState();
    const files = apiRef.current.getFiles();

    const blob = await exportToBlob({
      elements,
      appState: {
        ...appState,
        exportBackground: true
      },
      files,
      mimeType: "image/png"
    });

    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  }, []);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadPng = useCallback(async () => {
    if (!apiRef.current) {
      return;
    }

    const { exportToBlob } = await import("@excalidraw/excalidraw");
    const blob = await exportToBlob({
      elements: apiRef.current.getSceneElements(),
      appState: {
        ...apiRef.current.getAppState(),
        exportBackground: true
      },
      files: apiRef.current.getFiles(),
      mimeType: "image/png"
    });

    downloadBlob(blob, `diagram-${blockId}.png`);
  }, [blockId, downloadBlob]);

  const handleDownloadSvg = useCallback(async () => {
    if (!apiRef.current) {
      return;
    }

    const { exportToSvg } = await import("@excalidraw/excalidraw");
    const svg = await exportToSvg({
      elements: apiRef.current.getSceneElements(),
      appState: {
        ...apiRef.current.getAppState(),
        exportBackground: true
      },
      files: apiRef.current.getFiles()
    });

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svg);
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, `diagram-${blockId}.svg`);
  }, [blockId, downloadBlob]);

  const handleResetZoom = useCallback(() => {
    if (!apiRef.current) {
      return;
    }

    apiRef.current.updateScene({
      appState: {
        zoom: { value: 1 }
      } as never,
      commitToHistory: false
    });
  }, []);

  const handleCenterCanvas = useCallback(() => {
    if (!apiRef.current) {
      return;
    }

    apiRef.current.scrollToContent(undefined, {
      fitToContent: true,
      animate: true,
      duration: 160
    });
  }, []);

  const applyLayoutSettings = useCallback(
    (partial: Partial<DiagramLayoutSettings>) => {
      if (!yDoc || !canEdit) {
        return;
      }

      const current = getDiagramContent(yDoc, blockId);
      if (!current) {
        return;
      }

      const layoutSettings = {
        ...DEFAULT_DIAGRAM_LAYOUT_SETTINGS,
        ...(current.metadata?.layoutSettings ?? {}),
        ...partial
      };

      const elements = enrichArrowBindings(current.elements, layoutSettings);

      setDiagramContent(
        yDoc,
        blockId,
        {
          ...current,
          elements,
          metadata: {
            ...current.metadata,
            updatedAt: new Date().toISOString(),
            layoutSettings,
            arrowConnections: extractArrowConnections(elements)
          }
        },
        DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW
      );

      const api = apiRef.current;
      if (api) {
        api.updateScene({
          elements,
          appState: {
            gridSize: layoutSettings.snapToGrid ? layoutSettings.gridSize : null
          } as never,
          commitToHistory: false
        });
      }
    },
    [blockId, canEdit, yDoc]
  );

  const handleAlign = useCallback(
    (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (!yDoc || !canEdit || !apiRef.current) {
        return;
      }

      const current = getDiagramContent(yDoc, blockId);
      if (!current) {
        return;
      }

      const selectedIds = Object.keys(apiRef.current.getAppState().selectedElementIds ?? {});
      if (selectedIds.length < 2) {
        return;
      }

      const layoutSettings = getCurrentLayoutSettings();
      const elements = alignElements(current.elements, selectedIds, mode, layoutSettings);

      setDiagramContent(
        yDoc,
        blockId,
        {
          ...current,
          elements,
          metadata: {
            ...current.metadata,
            updatedAt: new Date().toISOString(),
            layoutSettings,
            arrowConnections: extractArrowConnections(elements)
          }
        },
        DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW
      );

      apiRef.current.updateScene({
        elements,
        commitToHistory: false
      });
    },
    [blockId, canEdit, getCurrentLayoutSettings, yDoc]
  );

  const handleDistribute = useCallback(
    (mode: "horizontal" | "vertical") => {
      if (!yDoc || !canEdit || !apiRef.current) {
        return;
      }

      const current = getDiagramContent(yDoc, blockId);
      if (!current) {
        return;
      }

      const selectedIds = Object.keys(apiRef.current.getAppState().selectedElementIds ?? {});
      if (selectedIds.length < 3) {
        return;
      }

      const layoutSettings = getCurrentLayoutSettings();
      const elements = distributeElements(current.elements, selectedIds, mode, layoutSettings);

      setDiagramContent(
        yDoc,
        blockId,
        {
          ...current,
          elements,
          metadata: {
            ...current.metadata,
            updatedAt: new Date().toISOString(),
            layoutSettings,
            arrowConnections: extractArrowConnections(elements)
          }
        },
        DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW
      );

      apiRef.current.updateScene({
        elements,
        commitToHistory: false
      });
    },
    [blockId, canEdit, getCurrentLayoutSettings, yDoc]
  );

  const applyTemplate = useCallback(
    async (template: DiagramTemplateKey) => {
      if (!yDoc || !canEdit) {
        return;
      }

      const selected = getDiagramTemplate(template);
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      const converted = convertToExcalidrawElements(selected.elements as never);
      const elements = enrichArrowBindings(converted);

      setDiagramContent(
        yDoc,
        blockId,
        {
          elements,
          appState: selected.appState ?? {},
          files: {},
          metadata: {
            updatedAt: new Date().toISOString(),
            layoutSettings: getCurrentLayoutSettings(),
            arrowConnections: extractArrowConnections(elements)
          }
        },
        DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW
      );

      const api = apiRef.current;
      if (api) {
        api.updateScene({
          elements,
          appState: selected.appState as never,
          commitToHistory: false
        });
        api.scrollToContent(undefined, { fitToContent: true, animate: true, duration: 130 });
      }

      props.updateAttributes({ templateKey: template });
    },
    [blockId, canEdit, getCurrentLayoutSettings, props, yDoc]
  );

  const handleApiReady = useCallback((api: ExcalidrawImperativeAPI | null) => {
    apiRef.current = api;
  }, []);

  const handleConsumeInitialElements = useCallback(() => {
    if (props.node.attrs.initialElements == null) {
      return;
    }

    props.updateAttributes({ initialElements: null });
  }, [props]);

  const handleFullscreen = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const maybeWebkitDocument = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
    };

    const activeElement = document.fullscreenElement ?? maybeWebkitDocument.webkitFullscreenElement;
    const isCurrentShellFullscreen = activeElement === shell;

    if (isCurrentShellFullscreen) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (maybeWebkitDocument.webkitExitFullscreen) {
        await maybeWebkitDocument.webkitExitFullscreen();
      }
      return;
    }

    if (document.fullscreenElement && document.fullscreenElement !== shell) {
      await document.exitFullscreen();
    }

    if (shell.requestFullscreen) {
      await shell.requestFullscreen();
      return;
    }

    shell.classList.toggle("is-fullscreen-fallback");
    document.body.classList.toggle("diagram-fullscreen-lock", shell.classList.contains("is-fullscreen-fallback"));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initializeFromTemplate = async () => {
      if (!yDoc || !canEdit || templateKey === "blank") {
        return;
      }

      const current = getDiagramContent(yDoc, blockId);
      if (current && current.elements.length > 0) {
        return;
      }

      const selected = getDiagramTemplate(templateKey);
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

      if (cancelled) {
        return;
      }

      const converted = convertToExcalidrawElements(selected.elements as never);
      const elements = enrichArrowBindings(converted);
      setDiagramContent(
        yDoc,
        blockId,
        {
          elements,
          appState: selected.appState ?? {},
          files: {},
          metadata: {
            updatedAt: new Date().toISOString(),
            layoutSettings: getCurrentLayoutSettings(),
            arrowConnections: extractArrowConnections(elements)
          }
        },
        DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW
      );
    };

    void initializeFromTemplate();

    const syncFullscreenClasses = () => {
      const shell = shellRef.current;
      if (!shell) {
        return;
      }

      const maybeWebkitDocument = document as Document & {
        webkitFullscreenElement?: Element;
      };

      const activeElement = document.fullscreenElement ?? maybeWebkitDocument.webkitFullscreenElement;
      const isNativeFullscreen = activeElement === shell;

      shell.classList.toggle("is-native-fullscreen", isNativeFullscreen);

      if (!isNativeFullscreen) {
        shell.classList.remove("is-fullscreen-fallback");
        document.body.classList.remove("diagram-fullscreen-lock");
      }
    };

    document.addEventListener("fullscreenchange", syncFullscreenClasses);
    document.addEventListener("webkitfullscreenchange", syncFullscreenClasses as EventListener);

    return () => {
      cancelled = true;
      document.removeEventListener("fullscreenchange", syncFullscreenClasses);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenClasses as EventListener);
      document.body.classList.remove("diagram-fullscreen-lock");
    };
  }, [blockId, canEdit, getCurrentLayoutSettings, templateKey, yDoc]);

  const insertBelow = useCallback(
    (kind: "text" | "diagram") => {
      const position = typeof props.getPos === "function" ? props.getPos() : null;
      if (typeof position !== "number") {
        return;
      }

      const chain = props.editor.chain().focus(position + props.node.nodeSize);

      if (kind === "diagram") {
        chain.insertDiagram();
      } else {
        chain.insertContent({ type: "paragraph" });
      }

      chain.insertContent({ type: "paragraph" }).run();
    },
    [props]
  );

  return (
    <NodeViewWrapper className={wrapperClassName}>
      <div className="diagram-node-shell overflow-hidden rounded-xl border border-border/80 bg-muted/20 p-3">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-medium">Diagram</span>

          <div className="diagram-node-toolbar flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                void handleFullscreen();
              }}
              aria-label="Toggle full screen"
            >
              <Expand className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                void handleCopyAsImage();
              }}
              aria-label="Copy PNG"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Export diagram">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => void handleDownloadPng()}>
                  <FileImage className="mr-2 h-4 w-4" />
                  Download PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleDownloadSvg()}>
                  <FileType2 className="mr-2 h-4 w-4" />
                  Download SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetZoom} aria-label="Reset zoom">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleCenterCanvas} aria-label="Center canvas">
              <LocateFixed className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Diagram settings">
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Connector style</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => applyLayoutSettings({ connectorStyle: "straight" })}>Straight</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyLayoutSettings({ connectorStyle: "elbow" })}>Elbow</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  onClick={() => {
                    const current = getCurrentLayoutSettings();
                    applyLayoutSettings({ snapToGrid: !current.snapToGrid });
                  }}
                >
                  Toggle snap grid
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Grid size</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {[10, 20, 40].map((size) => (
                      <DropdownMenuItem key={size} onClick={() => applyLayoutSettings({ gridSize: size })}>
                        {size}px
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Align selected</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleAlign("left")}>Left</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAlign("center")}>Center</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAlign("right")}>Right</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAlign("top")}>Top</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAlign("middle")}>Middle</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAlign("bottom")}>Bottom</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Distribute selected</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleDistribute("horizontal")}>Horizontal</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDistribute("vertical")}>Vertical</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleDuplicate}>
              <PenSquare className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => {
                props.deleteNode();
              }}
              disabled={!canEdit}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="diagram-node-overlay">Click to edit diagram</div>

        <div ref={shellRef} id={`diagram-shell-${blockId}`} className="diagram-node-canvas min-h-[320px] h-[460px] resize-y overflow-auto rounded-lg border border-border/60 bg-white">
          <DiagramCanvas
            blockId={blockId}
            yDoc={yDoc}
            canEdit={canEdit}
            initialElements={initialElements}
            onConsumeInitialElements={handleConsumeInitialElements}
            onApiReady={handleApiReady}
          />
        </div>

        <div className="mt-3 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={!canEdit}>
                <Plus className="h-3.5 w-3.5" />
                Insert below
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-44">
              <DropdownMenuItem
                onClick={() => {
                  insertBelow("text");
                }}
              >
                <Type className="mr-2 h-4 w-4" />
                Text block
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  insertBelow("diagram");
                }}
              >
                <PenSquare className="mr-2 h-4 w-4" />
                Diagram block (blank)
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Diagram template</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {DIAGRAM_TEMPLATES.filter((item) => item.key !== "blank").map((template) => (
                    <DropdownMenuItem
                      key={template.key}
                      onClick={() => {
                        const position = typeof props.getPos === "function" ? props.getPos() : null;
                        if (typeof position !== "number") {
                          return;
                        }

                        props.editor
                          .chain()
                          .focus(position + props.node.nodeSize)
                          .insertDiagramTemplate(template.key)
                          .insertContent({ type: "paragraph" })
                          .run();
                      }}
                    >
                      {template.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Apply template</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {DIAGRAM_TEMPLATES.map((template) => (
                    <DropdownMenuItem key={template.key} onClick={() => void applyTemplate(template.key)}>
                      {template.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  insertBelow("text");
                }}
              >
                Continue writing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const DiagramNodeViewMemo = memo(DiagramNodeView);
