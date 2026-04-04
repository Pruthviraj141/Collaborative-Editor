import * as Y from "yjs";

import type { DiagramBlockContent } from "@/types/diagram";

const DIAGRAMS_MAP_KEY = "diagrams";

export const DIAGRAM_ORIGINS = {
  LOCAL_EXCALIDRAW: "diagram:local-excalidraw",
  REMOTE_APPLY: "diagram:remote-apply",
  GC: "diagram:gc"
} as const;

type DiagramOrigin = (typeof DIAGRAM_ORIGINS)[keyof typeof DIAGRAM_ORIGINS];

export function getDiagramMap(yDoc: Y.Doc) {
  return yDoc.getMap<DiagramBlockContent>(DIAGRAMS_MAP_KEY);
}

export function getDiagramContent(yDoc: Y.Doc, blockId: string) {
  const diagramMap = getDiagramMap(yDoc);
  return diagramMap.get(blockId) ?? null;
}

export function setDiagramContent(
  yDoc: Y.Doc,
  blockId: string,
  content: DiagramBlockContent,
  origin: DiagramOrigin = DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW
) {
  const diagramMap = getDiagramMap(yDoc);
  yDoc.transact(() => {
    diagramMap.set(blockId, content);
  }, origin);
}

export function deleteDiagramContent(
  yDoc: Y.Doc,
  blockId: string,
  origin: DiagramOrigin = DIAGRAM_ORIGINS.GC
) {
  const diagramMap = getDiagramMap(yDoc);
  yDoc.transact(() => {
    diagramMap.delete(blockId);
  }, origin);
}

export function listDiagramBlockIds(yDoc: Y.Doc) {
  return Array.from(getDiagramMap(yDoc).keys());
}
