import { NextResponse } from "next/server";
import { getAdminCookieName, getAuthCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set(getAdminCookieName(), "", {
    ...getAuthCookieOptions(process.env.NODE_ENV === "production"),
    maxAge: 0,
  });
  return response;
}
