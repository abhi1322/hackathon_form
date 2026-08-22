import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin-api-auth";
import { connectDB } from "@/lib/db";
import {
  getOrCreateConfig,
  toPublicConfig,
  type ConfigDocument,
} from "@/lib/models/Config";
import { adminConfigUpdateSchema } from "@/lib/schemas/registration";

export async function GET() {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const config = await getOrCreateConfig();
    return NextResponse.json(toPublicConfig(config));
  } catch (error) {
    console.error("GET /api/admin/config failed:", error);
    return NextResponse.json(
      { error: "Failed to load configuration" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const body = await request.json();
    const parsed = adminConfigUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const config = await getOrCreateConfig();
    applyConfigUpdates(config, parsed.data);
    await config.save();

    return NextResponse.json(toPublicConfig(config));
  } catch (error) {
    console.error("PATCH /api/admin/config failed:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 },
    );
  }
}

function applyConfigUpdates(
  config: ConfigDocument,
  updates: {
    minTeamSize?: number;
    maxTeamSize?: number;
    minFemaleMembers?: number;
    allowedEmailDomain?: string;
    registrationOpen?: boolean;
  },
) {
  if (updates.minTeamSize !== undefined) {
    config.minTeamSize = updates.minTeamSize;
  }
  if (updates.maxTeamSize !== undefined) {
    config.maxTeamSize = updates.maxTeamSize;
  }
  if (updates.minFemaleMembers !== undefined) {
    config.minFemaleMembers = updates.minFemaleMembers;
  }
  if (updates.allowedEmailDomain !== undefined) {
    config.allowedEmailDomain = updates.allowedEmailDomain;
  }
  if (updates.registrationOpen !== undefined) {
    config.registrationOpen = updates.registrationOpen;
  }

  if (config.minTeamSize > config.maxTeamSize) {
    throw new Error("Minimum team size cannot exceed maximum team size");
  }
}
