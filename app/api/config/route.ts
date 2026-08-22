import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getOrCreateConfig, toPublicConfig } from "@/lib/models/Config";

export async function GET() {
  try {
    await connectDB();
    const config = await getOrCreateConfig();
    return NextResponse.json(toPublicConfig(config));
  } catch (error) {
    console.error("GET /api/config failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load configuration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
