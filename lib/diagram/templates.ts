import type { DiagramPersistedAppState } from "@/types/diagram";

export type DiagramTemplateKey = "blank" | "flowchart" | "process" | "mindmap" | "system";

interface TemplateElement {
  type: "rectangle" | "diamond" | "ellipse" | "arrow" | "text";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  backgroundColor?: string;
  strokeColor?: string;
  roundness?: {
    type: number;
  };
}

interface DiagramTemplateDefinition {
  key: DiagramTemplateKey;
  label: string;
  elements: TemplateElement[];
  appState?: DiagramPersistedAppState;
}

export const DIAGRAM_TEMPLATES: DiagramTemplateDefinition[] = [
  {
    key: "blank",
    label: "Blank",
    elements: []
  },
  {
    key: "flowchart",
    label: "Flowchart",
    elements: [
      { type: "rectangle", x: 80, y: 100, width: 180, height: 70, text: "Start", backgroundColor: "#dbeafe" },
      { type: "diamond", x: 340, y: 95, width: 160, height: 90, text: "Decision" },
      { type: "rectangle", x: 580, y: 100, width: 200, height: 70, text: "Outcome", backgroundColor: "#dcfce7" },
      { type: "arrow", x: 260, y: 135, width: 80, height: 0 },
      { type: "arrow", x: 500, y: 140, width: 80, height: 0 }
    ]
  },
  {
    key: "process",
    label: "Process",
    elements: [
      { type: "rectangle", x: 90, y: 120, width: 170, height: 64, text: "Input" },
      { type: "rectangle", x: 330, y: 120, width: 190, height: 64, text: "Transform" },
      { type: "rectangle", x: 600, y: 120, width: 170, height: 64, text: "Output" },
      { type: "arrow", x: 260, y: 150, width: 70, height: 0 },
      { type: "arrow", x: 520, y: 150, width: 80, height: 0 }
    ]
  },
  {
    key: "mindmap",
    label: "Mind map",
    elements: [
      { type: "ellipse", x: 360, y: 180, width: 180, height: 90, text: "Main idea", backgroundColor: "#ede9fe" },
      { type: "rectangle", x: 110, y: 70, width: 160, height: 60, text: "Branch A" },
      { type: "rectangle", x: 640, y: 70, width: 160, height: 60, text: "Branch B" },
      { type: "rectangle", x: 110, y: 300, width: 160, height: 60, text: "Branch C" },
      { type: "rectangle", x: 640, y: 300, width: 160, height: 60, text: "Branch D" },
      { type: "arrow", x: 330, y: 205, width: -60, height: -90 },
      { type: "arrow", x: 540, y: 205, width: 100, height: -90 },
      { type: "arrow", x: 330, y: 250, width: -60, height: 85 },
      { type: "arrow", x: 540, y: 250, width: 100, height: 85 }
    ]
  },
  {
    key: "system",
    label: "System design",
    elements: [
      { type: "rectangle", x: 90, y: 150, width: 170, height: 80, text: "Client", backgroundColor: "#e0f2fe" },
      { type: "rectangle", x: 340, y: 150, width: 170, height: 80, text: "API", backgroundColor: "#fef9c3" },
      { type: "rectangle", x: 600, y: 150, width: 190, height: 80, text: "Database", backgroundColor: "#fee2e2" },
      { type: "arrow", x: 260, y: 190, width: 80, height: 0 },
      { type: "arrow", x: 510, y: 190, width: 90, height: 0 }
    ]
  }
];

export function getDiagramTemplate(key: DiagramTemplateKey) {
  return DIAGRAM_TEMPLATES.find((template) => template.key === key) ?? DIAGRAM_TEMPLATES[0];
}
