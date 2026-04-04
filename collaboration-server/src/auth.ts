import { jwtVerify } from "jose";

import { getCollabTokenSecret } from "./env.js";
import type { CollabTokenPayload } from "./types.js";

const secret = new TextEncoder().encode(getCollabTokenSecret());

export async function verifyCollabToken(token: string): Promise<CollabTokenPayload> {
  const verification = await jwtVerify(token, secret);
  const payload = verification.payload as Partial<CollabTokenPayload>;

  if (!payload.documentId || !payload.userId || !payload.role) {
    throw new Error("Invalid collaboration token payload");
  }

  return {
    documentId: payload.documentId,
    userId: payload.userId,
    role: payload.role,
    name: payload.name ?? null,
    workspaceId: payload.workspaceId ?? null
  };
}

export function canWrite(role: CollabTokenPayload["role"]) {
  return role === "editor" || role === "owner";
}
