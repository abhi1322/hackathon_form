import { NextResponse } from "next/server";
import {
  getAdminCookieName,
  getAuthCookieOptions,
  signAdminToken,
  validateAdminCredentials,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!validateAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const token = await signAdminToken(email);
    const response = NextResponse.json({ message: "Logged in successfully" });
    response.cookies.set(
      getAdminCookieName(),
      token,
      getAuthCookieOptions(process.env.NODE_ENV === "production"),
    );

    return response;
  } catch (error) {
    console.error("POST /api/admin/login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
