import { NextResponse } from "next/server";
import { z } from "zod";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

import { getServerSessionUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env.server";

const requestSchema = z.object({
	prompt: z.string().trim().min(1).max(500),
	docId: z.string().trim().min(1)
});

const aiSchema = z.object({
	nodes: z.array(
		z.object({
			id: z.string().trim().min(1),
			label: z.string().trim().min(1).max(120),
			type: z.enum(["rectangle", "diamond", "ellipse", "arrow"]).optional().default("rectangle")
		})
	).min(1).max(12),
	edges: z.array(
		z.object({
			from: z.string().trim().min(1),
			to: z.string().trim().min(1),
			label: z.string().trim().max(120).optional()
		})
	).default([])
});

type AiNode = z.infer<typeof aiSchema>["nodes"][number];
type AiEdge = z.infer<typeof aiSchema>["edges"][number];

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a diagram generation assistant. When given a description, respond ONLY with a valid JSON object — no markdown, no explanation, no backticks. The JSON must have this exact shape:
{
	"nodes": [
		{ "id": "1", "label": "Start", "type": "rectangle" | "diamond" | "ellipse" | "arrow" }
	],
	"edges": [
		{ "from": "1", "to": "2", "label": "optional label" }
	]
}
Limit to 12 nodes max. Make it clear and logical. Use "diamond" for decisions, "ellipse" for start/end, "rectangle" for process steps.`;

const FALLBACK = {
	nodes: [
		{ id: "1", label: "Start", type: "ellipse" as const },
		{ id: "2", label: "Process", type: "rectangle" as const },
		{ id: "3", label: "End", type: "ellipse" as const }
	],
	edges: [
		{ from: "1", to: "2" },
		{ from: "2", to: "3" }
	]
};

function randomInt() {
	return Math.floor(Math.random() * 1_000_000_000);
}

function baseElement() {
	return {
		angle: 0,
		strokeColor: "#1e1e1e",
		backgroundColor: "#ffffff",
		fillStyle: "solid",
		strokeWidth: 2,
		strokeStyle: "solid",
		roughness: 0,
		opacity: 100,
		groupIds: [],
		frameId: null,
		roundness: null,
		seed: randomInt(),
		version: 1,
		versionNonce: randomInt(),
		isDeleted: false,
		boundElements: [] as Array<{ id: string; type: "arrow" | "text" }>,
		updated: Date.now(),
		link: null,
		locked: false
	};
}

function stripMarkdownFences(input: string) {
	return input
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/i, "")
		.trim();
}

function nodeSize(nodeType: AiNode["type"]) {
	if (nodeType === "diamond") {
		return { width: 140, height: 80, color: "#fff3cd" };
	}

	if (nodeType === "ellipse") {
		return { width: 140, height: 60, color: "#e8f4fd" };
	}

	return { width: 160, height: 60, color: "#ffffff" };
}

function estimateTextBox(text: string) {
	const lines = text.split("\n");
	const longest = lines.reduce((max, line) => Math.max(max, line.length), 1);
	return {
		width: Math.max(40, Math.round(longest * 8.6)),
		height: Math.max(20, lines.length * 20)
	};
}

function toExcalidrawElements(nodes: AiNode[], edges: AiEdge[]): ExcalidrawElement[] {
	const centerX = 300;
	const startY = 100;
	const spacingY = 160;

	const elements: Array<Record<string, unknown>> = [];
	const nodeMap = new Map<string, { id: string; textId: string; x: number; y: number; width: number; height: number }>();
	const arrowIdsByShape = new Map<string, string[]>();

	nodes.forEach((node, index) => {
		const size = nodeSize(node.type);
		const x = centerX - size.width / 2;
		const y = startY + index * spacingY;
		const shapeId = `shape-${node.id}`;
		const textId = `text-${node.id}`;
		const textBox = estimateTextBox(node.label);

		elements.push({
			id: shapeId,
			type: node.type === "arrow" ? "rectangle" : node.type,
			x,
			y,
			width: size.width,
			height: size.height,
			...baseElement(),
			backgroundColor: size.color
		});

		elements.push({
			id: textId,
			type: "text",
			x: x + size.width / 2 - textBox.width / 2,
			y: y + size.height / 2 - textBox.height / 2,
			width: textBox.width,
			height: textBox.height,
			text: node.label,
			fontSize: 16,
			fontFamily: 1,
			textAlign: "center",
			verticalAlign: "middle",
			baseline: 0,
			lineHeight: 1.25,
			originalText: node.label,
			containerId: shapeId,
			...baseElement(),
			backgroundColor: "transparent",
			boundElements: []
		});

		nodeMap.set(node.id, { id: shapeId, textId, x, y, width: size.width, height: size.height });
		arrowIdsByShape.set(shapeId, []);
	});

	edges.forEach((edge, index) => {
		const fromNode = nodeMap.get(edge.from);
		const toNode = nodeMap.get(edge.to);
		if (!fromNode || !toNode) {
			return;
		}

		const arrowId = `arrow-${index + 1}-${edge.from}-${edge.to}`;
		const startX = fromNode.x + fromNode.width / 2;
		const startYPos = fromNode.y + fromNode.height;
		const deltaY = toNode.y - startYPos;

		elements.push({
			id: arrowId,
			type: "arrow",
			x: startX,
			y: startYPos,
			width: 0,
			height: deltaY,
			points: [[0, 0], [0, 160]],
			startBinding: { elementId: fromNode.id, focus: 0, gap: 1 },
			endBinding: { elementId: toNode.id, focus: 0, gap: 1 },
			startArrowhead: null,
			endArrowhead: "arrow",
			...baseElement(),
			backgroundColor: "transparent"
		});

		arrowIdsByShape.set(fromNode.id, [...(arrowIdsByShape.get(fromNode.id) ?? []), arrowId]);
		arrowIdsByShape.set(toNode.id, [...(arrowIdsByShape.get(toNode.id) ?? []), arrowId]);

		if (edge.label) {
			const textId = `edge-label-${index + 1}`;
			const metrics = estimateTextBox(edge.label);
			elements.push({
				id: textId,
				type: "text",
				x: startX + 16,
				y: startYPos + Math.max(20, deltaY / 2),
				width: metrics.width,
				height: metrics.height,
				text: edge.label,
				fontSize: 14,
				fontFamily: 1,
				textAlign: "center",
				verticalAlign: "middle",
				baseline: 0,
				lineHeight: 1.25,
				originalText: edge.label,
				containerId: arrowId,
				...baseElement(),
				backgroundColor: "transparent",
				boundElements: []
			});
		}
	});

	const finalized = elements.map((element) => {
		const typed = element as { id?: string; type?: string; containerId?: string };
		if (!typed.id) {
			return element;
		}

		if (typed.type === "rectangle" || typed.type === "diamond" || typed.type === "ellipse") {
			const bound = [
				{ id: nodeMap.get(typed.id.replace(/^shape-/, ""))?.textId ?? "", type: "text" as const },
				...(arrowIdsByShape.get(typed.id) ?? []).map((id) => ({ id, type: "arrow" as const }))
			].filter((item) => item.id.length > 0);

			return {
				...element,
				boundElements: bound
			};
		}

		return element;
	});

	return finalized as ExcalidrawElement[];
}

async function callGroq(prompt: string): Promise<{ nodes: AiNode[]; edges: AiEdge[]; usedFallback: boolean }> {
	if (!serverEnv.GROQ_API_KEY) {
		const error = new Error("AI diagram generation is not configured");
		Object.assign(error, { status: 500 });
		throw error;
	}

	const model = serverEnv.GROQ_MODEL_NAME || MODEL;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 20_000);

	try {
		const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
			method: "POST",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${serverEnv.GROQ_API_KEY}`
			},
			body: JSON.stringify({
				model,
				temperature: 0.2,
				response_format: { type: "json_object" },
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					{ role: "user", content: prompt }
				]
			})
		});

		if (!response.ok) {
			return { ...FALLBACK, usedFallback: true };
		}

		const payload = (await response.json()) as {
			choices?: Array<{
				message?: {
					content?: string;
				};
			}>;
		};

		const raw = payload.choices?.[0]?.message?.content ?? "";
		const stripped = stripMarkdownFences(raw);
		const parsed = aiSchema.safeParse(JSON.parse(stripped));

		if (!parsed.success) {
			return { ...FALLBACK, usedFallback: true };
		}

		return { ...parsed.data, usedFallback: false };
	} catch (cause) {
		if (cause instanceof Error && cause.name === "AbortError") {
			const timeoutError = new Error("AI service timed out");
			Object.assign(timeoutError, { status: 504 });
			throw timeoutError;
		}

		return { ...FALLBACK, usedFallback: true };
	} finally {
		clearTimeout(timeout);
	}
}

export async function POST(request: Request) {
	const user = await getServerSessionUser();
	if (!user) {
		return NextResponse.json({ error: "Authentication required" }, { status: 401 });
	}

	try {
		const json = (await request.json()) as unknown;
		const parsed = requestSchema.safeParse(json);

		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
		}

		const { nodes, edges, usedFallback } = await callGroq(parsed.data.prompt);
		const elements = toExcalidrawElements(nodes, edges);

		return NextResponse.json({ success: true, elements, usedFallback }, { status: 200 });
	} catch (cause) {
		const status = (cause as { status?: number }).status ?? 500;
		const message = cause instanceof Error ? cause.message : "Failed to generate diagram";
		return NextResponse.json({ error: message }, { status });
	}
}
