import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createTeamWithMembers,
  mapDuplicateError,
} from "@/lib/duplicate-error";
import { getOrCreateConfig } from "@/lib/models/Config";
import { createRegistrationSchema } from "@/lib/schemas/registration";

export async function POST(request: Request) {
  let payload: unknown;
  let validatedPayload:
    | import("@/lib/schemas/registration").RegistrationInput
    | null = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const session = await mongoose.startSession();

  try {
    await connectDB();
    const config = await getOrCreateConfig();

    if (!config.registrationOpen) {
      return NextResponse.json(
        { error: "Registration is currently closed." },
        { status: 403 },
      );
    }

    const schema = createRegistrationSchema({
      minTeamSize: config.minTeamSize,
      maxTeamSize: config.maxTeamSize,
      minFemaleMembers: config.minFemaleMembers,
      allowedEmailDomain: config.allowedEmailDomain,
    });

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    validatedPayload = parsed.data;
    let createdTeamId: string | null = null;

    await session.withTransaction(async () => {
      const team = await createTeamWithMembers(parsed.data, session);
      createdTeamId = team._id.toString();
    });

    return NextResponse.json(
      {
        message: "Team registered successfully",
        teamId: createdTeamId,
        teamName: parsed.data.teamName,
      },
      { status: 201 },
    );
  } catch (error) {
    if (validatedPayload) {
      const message = await mapDuplicateError(error, validatedPayload);
      return NextResponse.json({ error: message }, { status: 409 });
    }

    console.error("POST /api/register failed:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
