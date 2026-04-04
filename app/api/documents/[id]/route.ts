import { NextResponse } from "next/server";

import { assertCanWrite, getServerSessionUser } from "@/lib/auth";
import { DatabaseError, getDocumentById, updateDocumentMeta } from "@/lib/db/documents";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { updateDocumentSchema } from "@/lib/validators/document";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_: Request, { params }: Params) {
  const supabase = getSupabaseServerClient();
  const user = await getServerSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const document = await getDocumentById(supabase, params.id);
    return NextResponse.json({ document }, { status: 200 });
  } catch (cause) {
    const status = cause instanceof DatabaseError ? cause.status : 500;
    const message = cause instanceof DatabaseError ? cause.message : "Failed to fetch document";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const supabase = getSupabaseServerClient();
  const user = await getServerSessionUser();
  const userId = user?.id;

  try {
    assertCanWrite(userId);

    const json = (await request.json().catch(() => null)) as unknown;
    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
    }

    const parsed = updateDocumentSchema.safeParse({
      ...(json as Record<string, unknown>),
      id: params.id
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
    }

    const document = await updateDocumentMeta(supabase, {
      id: params.id,
      title: parsed.data.title,
      content: parsed.data.content,
      isArchived: parsed.data.isArchived,
      actorId: userId
    });

    return NextResponse.json({ document }, { status: 200 });
  } catch (cause) {
    const status = cause instanceof DatabaseError ? cause.status : (cause as { status?: number }).status ?? 500;
    const message = cause instanceof DatabaseError ? cause.message : "Failed to update document";
    return NextResponse.json({ error: message }, { status });
  }
}