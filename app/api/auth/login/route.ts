import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

function normalizeUsername(username: string) {
	return username.trim().toLowerCase();
}

function usernameToEmail(username: string) {
	return `${username}@writerflow.local`;
}

export async function POST(request: Request) {
	const payload = (await request.json().catch(() => null)) as { username?: string; password?: string } | null;

	const username = normalizeUsername(payload?.username ?? "");
	const password = payload?.password ?? "";

	if (!/^[a-z0-9_]{3,40}$/.test(username) || password.length < 8 || password.length > 128) {
		return NextResponse.json({ error: "Invalid login payload" }, { status: 400 });
	}

	const supabase = getSupabaseServerClient();

	const signIn = await supabase.auth.signInWithPassword({
		email: usernameToEmail(username),
		password
	});

	if (signIn.error || !signIn.data.user) {
		return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
	}

	return NextResponse.json(
		{
			user: {
				id: signIn.data.user.id,
				username,
				email: signIn.data.user.email ?? null
			}
		},
		{ status: 200 }
	);
}
