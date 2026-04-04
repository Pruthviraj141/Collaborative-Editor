import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getServerSessionUser() {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function assertCanWrite(userId: string | null | undefined): asserts userId is string {
  if (!userId) {
    const error = new Error("Authentication required for write operations");
    Object.assign(error, { status: 401 });
    throw error;
  }
}