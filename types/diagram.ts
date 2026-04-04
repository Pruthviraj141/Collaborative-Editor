import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

export type DocumentBlockType = "text" | "diagram";

export type DiagramPersistedAppState = Pick<
  Partial<AppState>,
  "viewBackgroundColor" | "theme" | "gridSize"
>;

export interface DiagramLayoutSettings {
  connectorStyle: "straight" | "elbow";
  snapToGrid: boolean;
  gridSize: number;
}

export const DEFAULT_DIAGRAM_LAYOUT_SETTINGS: DiagramLayoutSettings = {
  connectorStyle: "straight",
  snapToGrid: false,
  gridSize: 20
};

export interface DiagramBlockMetadata {
  updatedAt: string;
  layoutSettings?: DiagramLayoutSettings;
  arrowConnections?: Record<
    string,
    {
      startElementId: string | null;
      endElementId: string | null;
      startAnchor: "top" | "bottom" | "left" | "right" | null;
      endAnchor: "top" | "bottom" | "left" | "right" | null;
    }
  >;
}

export interface DiagramBlockContent {
  elements: ExcalidrawElement[];
  appState: DiagramPersistedAppState;
  files: BinaryFiles;
  metadata: DiagramBlockMetadata;
}

export interface DocumentBlockRecord {
  id: string;
  type: DocumentBlockType;
  position: number;
  content: string | DiagramBlockContent;
}
