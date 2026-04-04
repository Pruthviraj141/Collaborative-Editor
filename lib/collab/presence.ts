import type { CollaboratorPresence } from "@/types/editor";

const palette = [
  "#2563eb",
  "#9333ea",
  "#16a34a",
  "#ea580c",
  "#0891b2",
  "#db2777",
  "#4f46e5",
  "#0f766e"
] as const;

function hashSeed(seed: string) {
  let value = 0;

  for (let index = 0; index < seed.length; index += 1) {
    value = (value << 5) - value + seed.charCodeAt(index);
    value |= 0;
  }

  return Math.abs(value);
}

export function createPresence(seed: string, preferredName?: string | null): CollaboratorPresence {
  const hash = hashSeed(seed);
  const color = palette[hash % palette.length];
  const suffix = String(hash % 1000).padStart(3, "0");

  return {
    id: seed,
    name: preferredName?.trim() ? preferredName.trim() : `Guest ${suffix}`,
    color
  };
}
