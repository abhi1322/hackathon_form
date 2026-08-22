import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminToken } from "./lib/auth-edge";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/api/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getAdminCookieName())?.value;

  if (!token) {
    return unauthorizedResponse(request, isAdminApi);
  }

  try {
    await verifyAdminToken(token);
    return NextResponse.next();
  } catch {
    return unauthorizedResponse(request, isAdminApi);
  }
}

function unauthorizedResponse(request: NextRequest, isAdminApi: boolean) {
  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
