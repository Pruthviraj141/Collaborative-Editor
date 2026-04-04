import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth";
import { DatabaseError, getDocumentById } from "@/lib/db/documents";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    await getDocumentById(supabase, params.id);

    const { data, error } = await supabase
      .schema("public")
      .from("document_yjs_state")
      .select("yjs_state_base64,version,updated_at")
      .eq("document_id", params.id)
      .maybeSingle<{ yjs_state_base64: string; version: number; updated_at: string }>();

    if (error) {
      throw new DatabaseError("Unable to fetch persisted yjs state", 500);
    }

    return NextResponse.json(
      {
        hasState: Boolean(data?.yjs_state_base64),
        yjsStateBase64: data?.yjs_state_base64 ?? null,
        yjsStateLength: data?.yjs_state_base64?.length ?? 0,
        version: data?.version ?? null,
        updatedAt: data?.updated_at ?? null
      },
      { status: 200 }
    );
  } catch (cause) {
    const status = cause instanceof DatabaseError ? cause.status : 500;
    const message = cause instanceof DatabaseError ? cause.message : "Unable to fetch persisted yjs state";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, { params }: Params) {
  const supabase = getSupabaseServerClient();
  const user = await getServerSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    yjsStateBase64?: string;
    htmlSnapshot?: string | null;
  } | null;

  if (!payload?.yjsStateBase64 || typeof payload.yjsStateBase64 !== "string") {
    return NextResponse.json({ error: "Invalid yjs state payload" }, { status: 400 });
  }

  try {
    await getDocumentById(supabase, params.id);

    const { data: current, error: currentError } = await supabase
      .schema("public")
      .from("document_yjs_state")
      .select("version")
      .eq("document_id", params.id)
      .maybeSingle<{ version: number }>();

    if (currentError) {
      throw new DatabaseError("Unable to fetch current yjs version", 500);
    }

    const nextVersion = (current?.version ?? 0) + 1;

    const { error } = await supabase
      .schema("public")
      .from("document_yjs_state")
      .upsert(
        {
          document_id: params.id,
          yjs_state_base64: payload.yjsStateBase64,
          html_snapshot: payload.htmlSnapshot ?? null,
          updated_by: user.id,
          version: nextVersion,
          updated_at: new Date().toISOString()
        },
        { onConflict: "document_id" }
      );

    if (error) {
      throw new DatabaseError("Unable to persist yjs state", 500);
    }

    if (process.env.NODE_ENV === "development") {
      console.info("[api:yjs-state] saved", {
        documentId: params.id,
        version: nextVersion,
        stateLength: payload.yjsStateBase64.length,
        at: new Date().toISOString()
      });
    }

    return NextResponse.json({ ok: true, version: nextVersion }, { status: 200 });
  } catch (cause) {
    const status = cause instanceof DatabaseError ? cause.status : 500;
    const message = cause instanceof DatabaseError ? cause.message : "Unable to persist yjs state";
    return NextResponse.json({ error: message }, { status });
  }
}
