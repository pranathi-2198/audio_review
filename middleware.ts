import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

const publicPaths = ["/login", "/api/login", "/api/logout"];

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = await isAuthenticated(request);

  if (isPublicPath(pathname)) {
    if (pathname === "/login" && authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (authenticated) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
