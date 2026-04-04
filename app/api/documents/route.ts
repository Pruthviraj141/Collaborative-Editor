import { NextResponse } from "next/server";

import { assertCanWrite, getServerSessionUser } from "@/lib/auth";
import { createDocument, DatabaseError, listDocuments } from "@/lib/db/documents";
import { publicEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createDocumentSchema } from "@/lib/validators/document";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const user = await getServerSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const documents = await listDocuments(supabase, {
      userId: user.id,
      workspaceId: publicEnv.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID
    });

    return NextResponse.json({ documents }, { status: 200 });
  } catch (cause) {
    const status = cause instanceof DatabaseError ? cause.status : 500;
    const message = cause instanceof DatabaseError ? cause.message : "Failed to fetch documents";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const user = await getServerSessionUser();
  const userId = user?.id;

  try {
    assertCanWrite(userId);

    const json = (await request.json()) as unknown;
    const parsed = createDocumentSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid document payload" }, { status: 400 });
    }

    const document = await createDocument(supabase, {
      title: parsed.data.title,
      content: parsed.data.content,
      ownerId: userId,
      workspaceId: parsed.data.workspaceId
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (cause) {
    const status = cause instanceof DatabaseError ? cause.status : (cause as { status?: number }).status ?? 500;
    const message = cause instanceof DatabaseError ? cause.message : "Failed to create document";
    return NextResponse.json({ error: message }, { status });
  }
}