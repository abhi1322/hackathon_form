import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin-api-auth";
import { connectDB } from "@/lib/db";
import {
  deleteTeamWithMembers,
  mapDuplicateError,
  replaceTeamMembers,
} from "@/lib/duplicate-error";
import { getOrCreateConfig, resolveAllowedEmailDomains } from "@/lib/models/Config";
import { Participant } from "@/lib/models/Participant";
import { Team } from "@/lib/models/Team";
import { runWithOptionalTransaction } from "@/lib/mongo-transaction";
import { createRegistrationSchema } from "@/lib/schemas/registration";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const { id } = await context.params;
    const team = await Team.findById(id).lean();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const members = await Participant.find({ teamId: id }).lean();

    return NextResponse.json({
      id: team._id.toString(),
      name: team.name,
      memberCount: team.memberCount,
      femaleCount: team.femaleCount,
      problemStatement: team.problemStatement ?? "",
      createdAt: team.createdAt,
      members: members.map((member) => ({
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        registrationId: member.registrationId,
        phone: member.phone,
        gender: member.gender,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/teams/[id] failed:", error);
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  let payload: unknown;
  let validatedPayload:
    | import("@/lib/schemas/registration").RegistrationInput
    | null = null;

  try {
    payload = await request.json();
    await connectDB();
    const { id } = await context.params;

    const existingTeam = await Team.findById(id);
    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const config = await getOrCreateConfig();
    const schema = createRegistrationSchema(
      {
        minTeamSize: config.minTeamSize,
        maxTeamSize: config.maxTeamSize,
        minFemaleMembers: config.minFemaleMembers,
        allowedEmailDomains: resolveAllowedEmailDomains(config),
        problemStatements: config.problemStatements ?? [],
      },
      { legacyProblemStatement: existingTeam.problemStatement ?? "" },
    );

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    validatedPayload = parsed.data;

    await runWithOptionalTransaction(async (session) => {
      await replaceTeamMembers(id, parsed.data, { session });
    });

    return NextResponse.json({
      message: "Team updated successfully",
      teamName: parsed.data.teamName,
    });
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

    console.error("PATCH /api/admin/teams/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const { id } = await context.params;

    const existingTeam = await Team.findById(id);
    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    await runWithOptionalTransaction(async (session) => {
      await deleteTeamWithMembers(id, { session });
    });

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/teams/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 },
    );
  }
}
