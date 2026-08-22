import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin-api-auth";
import { getAdminCookieName, getAuthCookieOptions } from "@/lib/auth";

export async function POST() {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set(getAdminCookieName(), "", {
    ...getAuthCookieOptions(process.env.NODE_ENV === "production"),
    maxAge: 0,
  });
  return response;
}
