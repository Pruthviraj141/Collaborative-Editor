import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

const PUBLIC_ROUTES = ["/"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isEditorRoute = pathname.startsWith("/editor");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isDocumentsApi = pathname.startsWith("/api/documents");

  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: "",
            ...options
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (isDocumentsApi && !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if ((isEditorRoute || isDashboardRoute) && !user) {
    const target = `${pathname}${request.nextUrl.search}`;
    const redirectUrl = new URL(`/auth?next=${encodeURIComponent(target)}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (isPublicRoute) {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/", "/editor/:path*", "/dashboard/:path*", "/api/documents/:path*"]
};