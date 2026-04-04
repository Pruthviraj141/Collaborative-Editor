import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true }, { status: 200 });
}
