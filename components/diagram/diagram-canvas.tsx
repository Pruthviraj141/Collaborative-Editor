"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  ExcalidrawProps
} from "@excalidraw/excalidraw/types/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type * as Y from "yjs";

import { DIAGRAM_ORIGINS, getDiagramContent, setDiagramContent } from "@/lib/collab/diagram-state";
import { enrichArrowBindings, extractArrowConnections } from "@/lib/diagram/arrow-bindings";
import {
  DEFAULT_DIAGRAM_LAYOUT_SETTINGS,
  type DiagramBlockContent,
  type DiagramPersistedAppState
} from "@/types/diagram";

const Excalidraw = dynamic(async () => {
  const excalidrawModule = await import("@excalidraw/excalidraw");
  return excalidrawModule.Excalidraw as ComponentType<ExcalidrawProps>;
}, { ssr: false });

interface DiagramCanvasProps {
  blockId: string;
  yDoc: Y.Doc | null;
  canEdit: boolean;
  initialElements?: string | null;
  onConsumeInitialElements?: () => void;
  onApiReady?: (api: ExcalidrawImperativeAPI | null) => void;
}

const EMPTY_SCENE: DiagramBlockContent = {
  elements: [],
  appState: {},
  files: {},
  metadata: {
    updatedAt: new Date(0).toISOString(),
    layoutSettings: DEFAULT_DIAGRAM_LAYOUT_SETTINGS,
    arrowConnections: {}
  }
};

function pickPersistedAppState(appState: AppState): DiagramPersistedAppState {
  return {
    viewBackgroundColor: appState.viewBackgroundColor,
    theme: appState.theme,
    gridSize: appState.gridSize
  };
}

function computeSceneVersion(scene: DiagramBlockContent) {
  const elementVersion = scene.elements
    .map((element) => `${element.id}:${element.version}`)
    .join(",");

  return [
    elementVersion,
    Object.keys(scene.files).length,
    scene.appState.theme ?? "",
    scene.appState.viewBackgroundColor ?? "",
    scene.appState.gridSize ?? ""
  ].join("|");
}

function normalizeScene(content: DiagramBlockContent | null): DiagramBlockContent {
  if (!content) {
    return EMPTY_SCENE;
  }

  return {
    elements: content.elements ?? [],
    appState: content.appState ?? {},
    files: content.files ?? {},
    metadata: {
      updatedAt: content.metadata?.updatedAt ?? new Date(0).toISOString(),
      layoutSettings: content.metadata?.layoutSettings ?? DEFAULT_DIAGRAM_LAYOUT_SETTINGS,
      arrowConnections: content.metadata?.arrowConnections ?? {}
    }
  };
}

function DiagramCanvasComponent({ blockId, yDoc, canEdit, initialElements, onConsumeInitialElements, onApiReady }: DiagramCanvasProps) {
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const isApplyingRemoteRef = useRef(false);
  const applyFrameRef = useRef<number | null>(null);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInitialElementsRef = useRef<string | null>(null);
  const consumedInitialElementsRef = useRef<string | null>(null);
  const pendingInitialTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSceneRef = useRef<DiagramBlockContent | null>(null);
  const lastAppliedVersionRef = useRef<string>("");
  const lastSentVersionRef = useRef<string>("");

  const clearPendingInitialTimeout = useCallback(() => {
    if (pendingInitialTimeoutRef.current) {
      clearTimeout(pendingInitialTimeoutRef.current);
      pendingInitialTimeoutRef.current = null;
    }
  }, []);

  const initialData = useMemo((): ExcalidrawInitialDataState => {
    if (!yDoc) {
      return { elements: [], appState: {} };
    }

    const scene = normalizeScene(getDiagramContent(yDoc, blockId));

    return {
      elements: scene.elements,
      appState: scene.appState,
      files: scene.files
    };
  }, [blockId, yDoc]);

  useEffect(() => {
    if (!yDoc || !canEdit) {
      return;
    }

    if (getDiagramContent(yDoc, blockId)) {
      return;
    }

    setDiagramContent(
      yDoc,
      blockId,
      {
        ...EMPTY_SCENE,
        metadata: {
          updatedAt: new Date().toISOString(),
          layoutSettings: DEFAULT_DIAGRAM_LAYOUT_SETTINGS,
          arrowConnections: {}
        }
      },
      DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW
    );
  }, [blockId, canEdit, yDoc]);

  const applyRemoteScene = useCallback(() => {
    if (!yDoc) {
      return;
    }

    const api = excalidrawApiRef.current;
    if (!api) {
      return;
    }

    const scene = normalizeScene(getDiagramContent(yDoc, blockId));
    const nextVersion = computeSceneVersion(scene);

    if (nextVersion === lastAppliedVersionRef.current) {
      return;
    }

    isApplyingRemoteRef.current = true;
    const fileList = Object.values(scene.files);
    if (fileList.length > 0) {
      api.addFiles(fileList);
    }

    api.updateScene({
      elements: scene.elements,
      appState: scene.appState as AppState,
      commitToHistory: false
    });

    lastAppliedVersionRef.current = nextVersion;
    lastSentVersionRef.current = nextVersion;

    queueMicrotask(() => {
      isApplyingRemoteRef.current = false;
    });
  }, [blockId, yDoc]);

  const applyInitialElements = useCallback((raw: string) => {
    const api = excalidrawApiRef.current;
    if (!api) {
      pendingInitialElementsRef.current = raw;
      clearPendingInitialTimeout();
      pendingInitialTimeoutRef.current = setTimeout(() => {
        if (pendingInitialElementsRef.current) {
          console.warn("Initial diagram elements pending for 5s; Excalidraw API was not ready.");
        }
      }, 5000);
      return;
    }

    if (consumedInitialElementsRef.current === raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ExcalidrawElement[];

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid initial elements payload");
      }

      api.updateScene({
        elements: parsed,
        appState: {
          viewBackgroundColor: "#ffffff"
        } as AppState,
        commitToHistory: false
      });
      consumedInitialElementsRef.current = raw;
      pendingInitialElementsRef.current = null;
      clearPendingInitialTimeout();
      onConsumeInitialElements?.();
    } catch {
      consumedInitialElementsRef.current = raw;
      pendingInitialElementsRef.current = null;
      clearPendingInitialTimeout();
      onConsumeInitialElements?.();
    }
  }, [clearPendingInitialTimeout, onConsumeInitialElements]);

  useEffect(() => {
    if (!yDoc) {
      return;
    }

    const map = yDoc.getMap<DiagramBlockContent>("diagrams");

    const observer = (event: Y.YMapEvent<DiagramBlockContent>, transaction: Y.Transaction) => {
      if (!event.keysChanged.has(blockId)) {
        return;
      }

      if (
        transaction.origin === DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW ||
        transaction.origin === DIAGRAM_ORIGINS.REMOTE_APPLY
      ) {
        return;
      }

      if (applyFrameRef.current !== null) {
        cancelAnimationFrame(applyFrameRef.current);
      }

      applyFrameRef.current = requestAnimationFrame(() => {
        applyFrameRef.current = null;
        applyRemoteScene();
      });
    };

    map.observe(observer);
    return () => {
      if (applyFrameRef.current !== null) {
        cancelAnimationFrame(applyFrameRef.current);
        applyFrameRef.current = null;
      }
      map.unobserve(observer);
    };
  }, [applyRemoteScene, blockId, yDoc]);

  useEffect(() => {
    return () => {
      if (sendTimerRef.current !== null) {
        clearTimeout(sendTimerRef.current);
        sendTimerRef.current = null;
      }
    };
  }, []);

  const handleApiRef = useCallback<NonNullable<ExcalidrawProps["excalidrawAPI"]>>((api) => {
    excalidrawApiRef.current = api;
    onApiReady?.(api);

    api.updateScene({
      appState: {
        isBindingEnabled: true
      } as AppState,
      commitToHistory: false
    });

    requestAnimationFrame(() => {
      if (api && pendingInitialElementsRef.current) {
        applyInitialElements(pendingInitialElementsRef.current);
      }
      applyRemoteScene();
    });
  }, [applyInitialElements, applyRemoteScene, onApiReady]);

  useEffect(() => {
    if (!initialElements) {
      pendingInitialElementsRef.current = null;
      clearPendingInitialTimeout();
      return;
    }

    applyInitialElements(initialElements);
  }, [applyInitialElements, clearPendingInitialTimeout, initialElements]);

  useEffect(() => {
    return () => {
      clearPendingInitialTimeout();
      onApiReady?.(null);
    };
  }, [clearPendingInitialTimeout, onApiReady]);

  const handleChange = useCallback<NonNullable<ExcalidrawProps["onChange"]>>(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles
    ) => {
      if (!yDoc || !canEdit || isApplyingRemoteRef.current) {
        return;
      }

      const currentScene = normalizeScene(getDiagramContent(yDoc, blockId));
      const layoutSettings = currentScene.metadata.layoutSettings ?? DEFAULT_DIAGRAM_LAYOUT_SETTINGS;
      const enrichedElements = enrichArrowBindings(elements as ExcalidrawElement[], layoutSettings);
      const scene: DiagramBlockContent = {
        elements: enrichedElements,
        appState: pickPersistedAppState(appState),
        files,
        metadata: {
          updatedAt: new Date().toISOString(),
          layoutSettings,
          arrowConnections: extractArrowConnections(enrichedElements)
        }
      };

      const nextVersion = computeSceneVersion(scene);
      if (nextVersion === lastSentVersionRef.current) {
        return;
      }

      pendingSceneRef.current = scene;

      if (sendTimerRef.current !== null) {
        return;
      }

      sendTimerRef.current = setTimeout(() => {
        sendTimerRef.current = null;
        const nextScene = pendingSceneRef.current;
        if (!nextScene) {
          return;
        }

        const versionToSend = computeSceneVersion(nextScene);
        if (versionToSend === lastSentVersionRef.current) {
          return;
        }

        lastSentVersionRef.current = versionToSend;
        setDiagramContent(yDoc, blockId, nextScene, DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW);
      }, 120);
    },
    [blockId, canEdit, yDoc]
  );

  const canvasProps = useMemo(
    () => ({
      viewModeEnabled: !canEdit,
      initialData,
      onChange: handleChange,
      excalidrawAPI: handleApiRef
    }),
    [canEdit, handleApiRef, handleChange, initialData]
  );

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-border/80 bg-white">
      <Excalidraw {...canvasProps} />
    </div>
  );
}

export const DiagramCanvas = memo(DiagramCanvasComponent);
