import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/admin-api-auth";
import { connectDB } from "@/lib/db";
import { getOrCreateConfig } from "@/lib/models/Config";
import { Participant } from "@/lib/models/Participant";
import { Team } from "@/lib/models/Team";

export async function GET() {
  const unauthorized = await requireAdminApiAuth();
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const config = await getOrCreateConfig();

    const [teams, participants] = await Promise.all([
      Team.find().sort({ createdAt: -1 }).lean(),
      Participant.find().lean(),
    ]);

    const totalTeams = teams.length;
    const totalParticipants = participants.length;
    const femaleParticipants = participants.filter(
      (participant) => participant.gender === "Female",
    ).length;
    const femaleParticipationPercent =
      totalParticipants === 0
        ? 0
        : Math.round((femaleParticipants / totalParticipants) * 100);

    const teamsMeetingQuota = teams.filter(
      (team) => team.femaleCount >= config.minFemaleMembers,
    ).length;
    const teamsNotMeetingQuota = totalTeams - teamsMeetingQuota;

    return NextResponse.json({
      totalTeams,
      totalParticipants,
      femaleParticipants,
      femaleParticipationPercent,
      teamsMeetingQuota,
      teamsNotMeetingQuota,
      minFemaleMembers: config.minFemaleMembers,
    });
  } catch (error) {
    console.error("GET /api/admin/stats failed:", error);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 },
    );
  }
}
