import { NextRequest, NextResponse } from "next/server";
import { authCookieName, createSessionToken, getAuthConfig, getSessionMaxAge } from "@/lib/auth";

function isSafeNextPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/");

  let authConfig: ReturnType<typeof getAuthConfig>;

  try {
    authConfig = getAuthConfig();
  } catch {
    return NextResponse.redirect(new URL("/login?error=config", request.url), { status: 303 });
  }

  if (username !== authConfig.username || password !== authConfig.password) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid");
    loginUrl.searchParams.set("next", isSafeNextPath(nextPath) ? nextPath : "/");

    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const token = await createSessionToken(username);
  const response = NextResponse.redirect(
    new URL(isSafeNextPath(nextPath) ? nextPath : "/", request.url),
    { status: 303 }
  );

  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    maxAge: getSessionMaxAge(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
