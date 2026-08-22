import mongoose from "mongoose";
import { Participant } from "@/lib/models/Participant";
import { Team } from "@/lib/models/Team";
import {
  normalizeEmail,
  normalizeRegistrationId,
  normalizeTeamName,
} from "@/lib/normalize";
import type { RegistrationInput } from "@/lib/schemas/registration";

interface MongoDuplicateError extends Error {
  code?: number;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, string>;
}

function isMongoDuplicateError(error: unknown): error is MongoDuplicateError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as MongoDuplicateError).code === 11000
  );
}

async function findTeamNameByParticipantField(
  field: "email" | "registrationId",
  value: string,
): Promise<string | null> {
  const query =
    field === "email"
      ? { email: normalizeEmail(value) }
      : { registrationId: normalizeRegistrationId(value) };

  const participant = await Participant.findOne(query).populate("teamId", "name");

  if (!participant?.teamId || typeof participant.teamId === "string") {
    return null;
  }

  const team = participant.teamId as { name?: string };
  return team.name ?? null;
}

export async function mapDuplicateError(
  error: unknown,
  payload: RegistrationInput,
): Promise<string> {
  if (!isMongoDuplicateError(error)) {
    return "Registration failed. Please try again.";
  }

  const keyPattern = error.keyPattern ?? {};
  const keyValue = error.keyValue ?? {};

  if (keyPattern.normalizedName) {
    const teamName = keyValue.normalizedName ?? payload.teamName;
    return `Team name "${teamName}" is already registered.`;
  }

  if (keyPattern.email) {
    const duplicateEmail = keyValue.email ?? "";
    const memberIndex = payload.members.findIndex(
      (member) => normalizeEmail(member.email) === duplicateEmail,
    );
    const memberLabel =
      memberIndex >= 0 ? `Member ${memberIndex + 1}` : "A member";
    const existingTeam = await findTeamNameByParticipantField(
      "email",
      duplicateEmail,
    );

    if (existingTeam) {
      return `${memberLabel}: this email is already registered under team '${existingTeam}'.`;
    }

    return `${memberLabel}: this email is already registered.`;
  }

  if (keyPattern.registrationId) {
    const duplicateRegistrationId = keyValue.registrationId ?? "";
    const memberIndex = payload.members.findIndex(
      (member) =>
        normalizeRegistrationId(member.registrationId) ===
        duplicateRegistrationId,
    );
    const memberLabel =
      memberIndex >= 0 ? `Member ${memberIndex + 1}` : "A member";
    const existingTeam = await findTeamNameByParticipantField(
      "registrationId",
      duplicateRegistrationId,
    );

    if (existingTeam) {
      return `${memberLabel}: this Registration ID is already registered under team '${existingTeam}'.`;
    }

    return `${memberLabel}: this Registration ID is already registered.`;
  }

  return "Registration failed due to a duplicate entry.";
}

export async function createTeamWithMembers(
  payload: RegistrationInput,
  session: mongoose.ClientSession,
) {
  const femaleCount = payload.members.filter(
    (member) => member.gender === "Female",
  ).length;

  const [team] = await Team.create(
    [
      {
        name: payload.teamName.trim(),
        normalizedName: normalizeTeamName(payload.teamName),
        memberCount: payload.members.length,
        femaleCount,
      },
    ],
    { session },
  );

  const participants = payload.members.map((member) => ({
    name: member.name.trim(),
    email: normalizeEmail(member.email),
    registrationId: normalizeRegistrationId(member.registrationId),
    phone: member.phone.trim(),
    gender: member.gender,
    teamId: team._id,
  }));

  await Participant.insertMany(participants, { session });

  return team;
}

export async function replaceTeamMembers(
  teamId: string,
  payload: RegistrationInput,
  session: mongoose.ClientSession,
) {
  const femaleCount = payload.members.filter(
    (member) => member.gender === "Female",
  ).length;

  await Participant.deleteMany({ teamId }, { session });

  const participants = payload.members.map((member) => ({
    name: member.name.trim(),
    email: normalizeEmail(member.email),
    registrationId: normalizeRegistrationId(member.registrationId),
    phone: member.phone.trim(),
    gender: member.gender,
    teamId,
  }));

  await Participant.insertMany(participants, { session });

  await Team.findByIdAndUpdate(
    teamId,
    {
      name: payload.teamName.trim(),
      normalizedName: normalizeTeamName(payload.teamName),
      memberCount: payload.members.length,
      femaleCount,
    },
    { session },
  );
}

export async function deleteTeamWithMembers(
  teamId: string,
  session: mongoose.ClientSession,
) {
  await Participant.deleteMany({ teamId }, { session });
  await Team.findByIdAndDelete(teamId, { session });
}
