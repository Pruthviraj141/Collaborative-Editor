import { NextResponse } from "next/server";
import { SignJWT } from "jose";

import { getServerSessionUser } from "@/lib/auth";
import { DatabaseError, getDocumentById } from "@/lib/db/documents";
import { getCollabTokenSecret, serverEnv } from "@/lib/env.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const documentId = url.searchParams.get("documentId");

  if (!documentId) {
    return badRequest("Missing documentId");
  }

  const supabase = getSupabaseServerClient();

  try {
    await getDocumentById(supabase, documentId);
  } catch (error) {
    const status = error instanceof DatabaseError ? error.status : 500;
    return NextResponse.json({ error: "Document not found" }, { status });
  }

  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const role = "editor";
  const userId = user.id;
  const displayName = user.email?.split("@")[0] ?? null;

  const token = await new SignJWT({
    documentId,
    role,
    name: displayName,
    userId,
    workspaceId: null
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${serverEnv.COLLAB_TOKEN_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(getCollabTokenSecret()));

  return NextResponse.json(
    {
      token,
      role,
      user: {
        id: userId,
        name: displayName
      }
    },
    { status: 200 }
  );
}
