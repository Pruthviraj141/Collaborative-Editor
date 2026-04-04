import type {
  ExcalidrawArrowElement,
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawLinearElement,
  PointBinding
} from "@excalidraw/excalidraw/types/element/types";
import { DEFAULT_DIAGRAM_LAYOUT_SETTINGS, type DiagramLayoutSettings } from "@/types/diagram";

const SNAP_DISTANCE = 36;
const DETACH_DISTANCE = 72;

type AnchorSide = "top" | "bottom" | "left" | "right";

interface ConnectorData {
  startId: string | null;
  endId: string | null;
  startAnchor: AnchorSide | null;
  endAnchor: AnchorSide | null;
}

function isBindable(element: ExcalidrawElement): element is ExcalidrawBindableElement {
  return ["rectangle", "diamond", "ellipse", "text", "image", "embeddable", "frame"].includes(element.type);
}

function isArrow(element: ExcalidrawElement): element is ExcalidrawArrowElement {
  return element.type === "arrow";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getBounds(element: ExcalidrawBindableElement) {
  const x1 = Math.min(element.x, element.x + element.width);
  const x2 = Math.max(element.x, element.x + element.width);
  const y1 = Math.min(element.y, element.y + element.height);
  const y2 = Math.max(element.y, element.y + element.height);

  return {
    x1,
    x2,
    y1,
    y2,
    width: Math.max(1, x2 - x1),
    height: Math.max(1, y2 - y1),
    cx: (x1 + x2) / 2,
    cy: (y1 + y2) / 2
  };
}

function getShapeCenter(element: ExcalidrawBindableElement) {
  const b = getBounds(element);
  return {
    x: b.cx,
    y: b.cy
  };
}

function getAnchorPoint(element: ExcalidrawBindableElement, anchor: AnchorSide) {
  const b = getBounds(element);

  switch (anchor) {
    case "top":
      return { x: b.cx, y: b.y1 };
    case "bottom":
      return { x: b.cx, y: b.y2 };
    case "left":
      return { x: b.x1, y: b.cy };
    default:
      return { x: b.x2, y: b.cy };
  }
}

function pickAnchorByDirection(source: ExcalidrawBindableElement, targetPoint: { x: number; y: number }): AnchorSide {
  const center = getShapeCenter(source);
  const dx = targetPoint.x - center.x;
  const dy = targetPoint.y - center.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }

  return dy >= 0 ? "bottom" : "top";
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function asConnectorData(customData: ExcalidrawElement["customData"]): ConnectorData | null {
  const raw = customData?.wfConnector;
  if (!raw || typeof raw !== "object") {
    return null;
  }

  return {
    startId: typeof raw.startId === "string" ? raw.startId : null,
    endId: typeof raw.endId === "string" ? raw.endId : null,
    startAnchor: raw.startAnchor as AnchorSide | null,
    endAnchor: raw.endAnchor as AnchorSide | null
  };
}

function withConnectorData(arrow: ExcalidrawArrowElement, data: ConnectorData | null) {
  const nextCustomData = { ...(arrow.customData ?? {}) } as Record<string, unknown>;

  if (!data || (!data.startId && !data.endId)) {
    delete nextCustomData.wfConnector;
    return {
      ...arrow,
      customData: Object.keys(nextCustomData).length > 0 ? nextCustomData : undefined
    };
  }

  nextCustomData.wfConnector = {
    startId: data.startId,
    endId: data.endId,
    startAnchor: data.startAnchor,
    endAnchor: data.endAnchor
  };

  return {
    ...arrow,
    customData: nextCustomData
  };
}

function distanceToBounds(x: number, y: number, element: ExcalidrawBindableElement) {
  const b = getBounds(element);
  const px = clamp(x, b.x1, b.x2);
  const py = clamp(y, b.y1, b.y2);
  return Math.hypot(px - x, py - y);
}

function computeFocus(x: number, y: number, element: ExcalidrawBindableElement) {
  const b = getBounds(element);
  const dx = (x - b.cx) / (b.width / 2);
  const dy = (y - b.cy) / (b.height / 2);

  if (Math.abs(dx) > Math.abs(dy)) {
    return clamp(dy, -1, 1);
  }

  return clamp(dx, -1, 1);
}

function buildBinding(
  x: number,
  y: number,
  element: ExcalidrawBindableElement
): PointBinding {
  return {
    elementId: element.id,
    focus: computeFocus(x, y, element),
    gap: 0
  };
}

function nearestShape(
  x: number,
  y: number,
  shapes: ExcalidrawBindableElement[]
): ExcalidrawBindableElement | null {
  let best: ExcalidrawBindableElement | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const shape of shapes) {
    const distance = distanceToBounds(x, y, shape);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = shape;
    }
  }

  if (!best || bestDistance > SNAP_DISTANCE) {
    return null;
  }

  return best;
}

function resolveLayoutSettings(layoutSettings?: Partial<DiagramLayoutSettings>): DiagramLayoutSettings {
  return {
    connectorStyle: layoutSettings?.connectorStyle ?? DEFAULT_DIAGRAM_LAYOUT_SETTINGS.connectorStyle,
    snapToGrid: layoutSettings?.snapToGrid ?? DEFAULT_DIAGRAM_LAYOUT_SETTINGS.snapToGrid,
    gridSize: Math.max(4, layoutSettings?.gridSize ?? DEFAULT_DIAGRAM_LAYOUT_SETTINGS.gridSize)
  };
}

function snapPoint(value: number, gridSize: number) {
  return Math.round(value / gridSize) * gridSize;
}

function snapShapePosition(element: ExcalidrawBindableElement, gridSize: number): ExcalidrawBindableElement {
  return {
    ...element,
    x: snapPoint(element.x, gridSize),
    y: snapPoint(element.y, gridSize)
  };
}

function buildStraightPoints(startPoint: { x: number; y: number }, endPoint: { x: number; y: number }): readonly [number, number][] {
  return [
    [0, 0],
    [endPoint.x - startPoint.x, endPoint.y - startPoint.y]
  ];
}

function buildElbowPoints(startPoint: { x: number; y: number }, endPoint: { x: number; y: number }): readonly [number, number][] {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;

  if (Math.abs(dx) < 8 || Math.abs(dy) < 8) {
    return buildStraightPoints(startPoint, endPoint);
  }

  const horizontalFirst = Math.abs(dx) >= Math.abs(dy);

  if (horizontalFirst) {
    const midX = startPoint.x + dx / 2;
    return [
      [0, 0],
      [midX - startPoint.x, 0],
      [midX - startPoint.x, dy],
      [dx, dy]
    ];
  }

  const midY = startPoint.y + dy / 2;
  return [
    [0, 0],
    [0, midY - startPoint.y],
    [dx, midY - startPoint.y],
    [dx, dy]
  ];
}

function getRoutedPoints(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  connectorStyle: DiagramLayoutSettings["connectorStyle"]
): readonly [number, number][] {
  const raw = connectorStyle === "elbow" ? buildElbowPoints(startPoint, endPoint) : buildStraightPoints(startPoint, endPoint);

  const compact: Array<[number, number]> = [];
  for (const point of raw) {
    const prev = compact[compact.length - 1];
    if (!prev || prev[0] !== point[0] || prev[1] !== point[1]) {
      compact.push([point[0], point[1]]);
    }
  }

  return compact;
}

function getArrowEndpoints(arrow: ExcalidrawLinearElement) {
  const first = arrow.points[0] ?? [0, 0];
  const last = arrow.points[arrow.points.length - 1] ?? [0, 0];

  return {
    startX: arrow.x + first[0],
    startY: arrow.y + first[1],
    endX: arrow.x + last[0],
    endY: arrow.y + last[1]
  };
}

function mergeBoundElements(
  element: ExcalidrawBindableElement,
  arrowIds: string[]
): ExcalidrawBindableElement {
  const existingText = (element.boundElements ?? []).filter((item) => item.type === "text");
  const arrowEntries = arrowIds.map((id) => ({ id, type: "arrow" as const }));
  const next = [...existingText, ...arrowEntries];

  return {
    ...element,
    boundElements: next.length > 0 ? next : null
  };
}

export interface ArrowConnections {
  [arrowId: string]: {
    startElementId: string | null;
    endElementId: string | null;
    startAnchor: AnchorSide | null;
    endAnchor: AnchorSide | null;
  };
}

export function extractArrowConnections(elements: readonly ExcalidrawElement[]): ArrowConnections {
  const connections: ArrowConnections = {};

  for (const element of elements) {
    if (!isArrow(element)) {
      continue;
    }

    const connector = asConnectorData(element.customData);

    connections[element.id] = {
      startElementId: connector?.startId ?? element.startBinding?.elementId ?? null,
      endElementId: connector?.endId ?? element.endBinding?.elementId ?? null,
      startAnchor: connector?.startAnchor ?? null,
      endAnchor: connector?.endAnchor ?? null
    };
  }

  return connections;
}

export function enrichArrowBindings(
  elements: readonly ExcalidrawElement[],
  layoutSettings?: Partial<DiagramLayoutSettings>
): ExcalidrawElement[] {
  const resolvedSettings = resolveLayoutSettings(layoutSettings);

  const normalizedElements = elements.map((element) => {
    if (!isBindable(element) || !resolvedSettings.snapToGrid) {
      return element;
    }

    return snapShapePosition(element, resolvedSettings.gridSize);
  });

  const shapes = normalizedElements.filter(isBindable);
  const shapeById = new Map(shapes.map((shape) => [shape.id, shape]));
  const arrowIndexByShapeId = new Map<string, string[]>();

  const updated = normalizedElements.map((element) => {
    if (!isArrow(element)) {
      return element;
    }

    const endpoints = getArrowEndpoints(element);

    const existing = asConnectorData(element.customData);

    const maybeStartShape = existing?.startId ? shapeById.get(existing.startId) ?? null : null;
    const maybeEndShape = existing?.endId ? shapeById.get(existing.endId) ?? null : null;

    let startShape = maybeStartShape;
    let endShape = maybeEndShape;

    let startAnchor = existing?.startAnchor ?? null;
    let endAnchor = existing?.endAnchor ?? null;

    if (startShape && startAnchor) {
      const point = getAnchorPoint(startShape, startAnchor);
      if (distance(point, { x: endpoints.startX, y: endpoints.startY }) > DETACH_DISTANCE) {
        startShape = null;
        startAnchor = null;
      }
    }

    if (endShape && endAnchor) {
      const point = getAnchorPoint(endShape, endAnchor);
      if (distance(point, { x: endpoints.endX, y: endpoints.endY }) > DETACH_DISTANCE) {
        endShape = null;
        endAnchor = null;
      }
    }

    if (!startShape) {
      startShape = nearestShape(endpoints.startX, endpoints.startY, shapes);
      if (startShape) {
        startAnchor = pickAnchorByDirection(startShape, {
          x: endpoints.endX,
          y: endpoints.endY
        });
      }
    }

    if (!endShape) {
      endShape = nearestShape(endpoints.endX, endpoints.endY, shapes);
      if (endShape) {
        endAnchor = pickAnchorByDirection(endShape, {
          x: endpoints.startX,
          y: endpoints.startY
        });
      }
    }

    if (startShape && !startAnchor) {
      startAnchor = pickAnchorByDirection(startShape, { x: endpoints.endX, y: endpoints.endY });
    }

    if (endShape && !endAnchor) {
      endAnchor = pickAnchorByDirection(endShape, { x: endpoints.startX, y: endpoints.startY });
    }

    const startPoint = startShape && startAnchor ? getAnchorPoint(startShape, startAnchor) : { x: endpoints.startX, y: endpoints.startY };
    const endPoint = endShape && endAnchor ? getAnchorPoint(endShape, endAnchor) : { x: endpoints.endX, y: endpoints.endY };

    const nextX = startPoint.x;
    const nextY = startPoint.y;
    const nextPoints = getRoutedPoints(startPoint, endPoint, resolvedSettings.connectorStyle);

    const nextStart = startShape ? buildBinding(startPoint.x, startPoint.y, startShape) : null;
    const nextEnd = endShape ? buildBinding(endPoint.x, endPoint.y, endShape) : null;

    if (nextStart?.elementId) {
      const ids = arrowIndexByShapeId.get(nextStart.elementId) ?? [];
      ids.push(element.id);
      arrowIndexByShapeId.set(nextStart.elementId, ids);
    }

    if (nextEnd?.elementId) {
      const ids = arrowIndexByShapeId.get(nextEnd.elementId) ?? [];
      ids.push(element.id);
      arrowIndexByShapeId.set(nextEnd.elementId, ids);
    }

    const withBindings: ExcalidrawArrowElement = {
      ...element,
      x: nextX,
      y: nextY,
      points: nextPoints,
      startBinding: nextStart,
      endBinding: nextEnd
    };

    return withConnectorData(withBindings, {
      startId: nextStart?.elementId ?? null,
      endId: nextEnd?.elementId ?? null,
      startAnchor,
      endAnchor
    });
  });

  return updated.map((element) => {
    if (!isBindable(element)) {
      return element;
    }

    const arrows = Array.from(new Set(arrowIndexByShapeId.get(element.id) ?? []));
    return mergeBoundElements(element, arrows);
  });
}

type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom";
type DistributeMode = "horizontal" | "vertical";

function asLayoutCandidate(element: ExcalidrawElement): element is ExcalidrawBindableElement {
  return isBindable(element) && !element.isDeleted;
}

export function alignElements(
  elements: readonly ExcalidrawElement[],
  selectedIds: readonly string[],
  mode: AlignMode,
  layoutSettings?: Partial<DiagramLayoutSettings>
): ExcalidrawElement[] {
  const selected = elements.filter((element) => asLayoutCandidate(element) && selectedIds.includes(element.id));

  if (selected.length < 2) {
    return [...elements];
  }

  const bounds = selected.map((item) => ({
    id: item.id,
    left: Math.min(item.x, item.x + item.width),
    right: Math.max(item.x, item.x + item.width),
    top: Math.min(item.y, item.y + item.height),
    bottom: Math.max(item.y, item.y + item.height),
    cx: Math.min(item.x, item.x + item.width) + Math.abs(item.width) / 2,
    cy: Math.min(item.y, item.y + item.height) + Math.abs(item.height) / 2
  }));

  const target = (() => {
    if (mode === "left") return Math.min(...bounds.map((item) => item.left));
    if (mode === "right") return Math.max(...bounds.map((item) => item.right));
    if (mode === "center") return bounds.reduce((acc, item) => acc + item.cx, 0) / bounds.length;
    if (mode === "top") return Math.min(...bounds.map((item) => item.top));
    if (mode === "bottom") return Math.max(...bounds.map((item) => item.bottom));
    return bounds.reduce((acc, item) => acc + item.cy, 0) / bounds.length;
  })();

  const moved = elements.map((element) => {
    if (!asLayoutCandidate(element) || !selectedIds.includes(element.id)) {
      return element;
    }

    const width = Math.abs(element.width);
    const height = Math.abs(element.height);
    const left = Math.min(element.x, element.x + element.width);

    if (mode === "left") return { ...element, x: target };
    if (mode === "right") return { ...element, x: target - width };
    if (mode === "center") return { ...element, x: target - width / 2 };
    if (mode === "top") return { ...element, y: target };
    if (mode === "bottom") return { ...element, y: target - height };

    return { ...element, x: left, y: target - height / 2 };
  });

  return enrichArrowBindings(moved, layoutSettings);
}

export function distributeElements(
  elements: readonly ExcalidrawElement[],
  selectedIds: readonly string[],
  mode: DistributeMode,
  layoutSettings?: Partial<DiagramLayoutSettings>
): ExcalidrawElement[] {
  const selected = elements
    .filter((element) => asLayoutCandidate(element) && selectedIds.includes(element.id))
    .map((element) => ({
      element,
      left: Math.min(element.x, element.x + element.width),
      top: Math.min(element.y, element.y + element.height),
      width: Math.abs(element.width),
      height: Math.abs(element.height)
    }));

  if (selected.length < 3) {
    return [...elements];
  }

  const sorted = [...selected].sort((a, b) => (mode === "horizontal" ? a.left - b.left : a.top - b.top));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const range = mode === "horizontal" ? last.left - first.left : last.top - first.top;
  const slot = range / (sorted.length - 1);

  const byId = new Map<string, { x: number; y: number }>();
  sorted.forEach((item, index) => {
    if (mode === "horizontal") {
      byId.set(item.element.id, { x: first.left + slot * index, y: item.element.y });
    } else {
      byId.set(item.element.id, { x: item.element.x, y: first.top + slot * index });
    }
  });

  const moved = elements.map((element) => {
    const next = byId.get(element.id);
    if (!next || !asLayoutCandidate(element)) {
      return element;
    }

    return {
      ...element,
      x: next.x,
      y: next.y
    };
  });

  return enrichArrowBindings(moved, layoutSettings);
}
