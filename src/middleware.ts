import type { NextRequest } from "next/server";

import { refreshSupabaseAuthCookies } from "@/lib/auth/middleware";

export function middleware(request: NextRequest) {
  return refreshSupabaseAuthCookies({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|txt|webp|woff|woff2)$).*)",
  ],
};
