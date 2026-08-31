import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createTeamWithMembers,
  mapDuplicateError,
} from "@/lib/duplicate-error";
import { getOrCreateConfig, resolveAllowedEmailDomains } from "@/lib/models/Config";
import { runWithOptionalTransaction } from "@/lib/mongo-transaction";
import { normalizeProblemStatements } from "@/lib/problem-statements";
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
      allowedEmailDomains: resolveAllowedEmailDomains(config),
      problemStatements: normalizeProblemStatements(
        config.problemStatements ?? [],
      ),
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

    await runWithOptionalTransaction(async (session) => {
      const team = await createTeamWithMembers(parsed.data, { session });
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
      const isDuplicate =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000;

      return NextResponse.json(
        { error: message },
        { status: isDuplicate ? 409 : 500 },
      );
    }

    console.error("POST /api/register failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Registration failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
