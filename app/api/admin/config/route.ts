import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin-api-auth";
import { connectDB } from "@/lib/db";
import {
  getOrCreateConfig,
  toPublicConfig,
  type ConfigDocument,
} from "@/lib/models/Config";
import {
  adminConfigUpdateSchema,
  type AdminConfigUpdate,
} from "@/lib/schemas/registration";

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

function applyConfigUpdates(config: ConfigDocument, updates: AdminConfigUpdate) {
  const fields: Array<keyof AdminConfigUpdate> = [
    "minTeamSize",
    "maxTeamSize",
    "minFemaleMembers",
    "allowedEmailDomain",
    "registrationOpen",
    "formEyebrow",
    "formTitle",
    "formDescription",
    "closedTitle",
    "closedMessage",
    "successTitle",
    "successMessage",
    "submitButtonText",
  ];

  for (const field of fields) {
    if (updates[field] !== undefined) {
      config.set(field, updates[field]);
    }
  }

  if (config.minTeamSize > config.maxTeamSize) {
    throw new Error("Minimum team size cannot exceed maximum team size");
  }
}
