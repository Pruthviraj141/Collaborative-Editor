import { NextResponse } from "next/server";

import { getServerSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getServerSessionUser();

  return NextResponse.json(
    {
      isAuthenticated: Boolean(user),
      user: user
        ? {
            id: user.id,
            email: user.email ?? null
          }
        : null
    },
    { status: 200 }
  );
}