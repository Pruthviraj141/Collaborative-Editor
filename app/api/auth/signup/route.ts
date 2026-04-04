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
		return NextResponse.json({ error: "Invalid signup payload" }, { status: 400 });
	}

	const supabase = getSupabaseServerClient();

	const signUp = await supabase.auth.signUp({
		email: usernameToEmail(username),
		password
	});

	if (signUp.error) {
		const normalized = signUp.error.message.toLowerCase();

		if (normalized.includes("already") || normalized.includes("exists") || normalized.includes("registered")) {
			return NextResponse.json({ error: "Username already taken" }, { status: 409 });
		}

		return NextResponse.json({ error: signUp.error.message }, { status: 400 });
	}

	const signIn = await supabase.auth.signInWithPassword({
		email: usernameToEmail(username),
		password
	});

	if (signIn.error || !signIn.data.user) {
		return NextResponse.json({ error: "Account created. Please login." }, { status: 200 });
	}

	return NextResponse.json(
		{
			user: {
				id: signIn.data.user.id,
				username,
				email: signIn.data.user.email ?? null
			}
		},
		{ status: 201 }
	);
}
