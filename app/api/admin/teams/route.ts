import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Participant } from "@/lib/models/Participant";
import { Team } from "@/lib/models/Team";
import { normalizeRegistrationId } from "@/lib/normalize";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    let teamIds: string[] | null = null;

    if (q) {
      const normalizedQuery = q.toLowerCase();
      const matchingParticipants = await Participant.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: normalizedQuery },
          { registrationId: normalizeRegistrationId(q) },
        ],
      }).select("teamId");

      const matchingTeams = await Team.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { normalizedName: normalizedQuery },
        ],
      }).select("_id");

      const idSet = new Set<string>();
      matchingParticipants.forEach((participant) =>
        idSet.add(participant.teamId.toString()),
      );
      matchingTeams.forEach((team) => idSet.add(team._id.toString()));
      teamIds = Array.from(idSet);
    }

    const teamQuery = teamIds ? { _id: { $in: teamIds } } : {};
    const teams = await Team.find(teamQuery).sort({ createdAt: -1 }).lean();
    const teamIdList = teams.map((team) => team._id);

    const participants = await Participant.find({
      teamId: { $in: teamIdList },
    }).lean();

    const participantsByTeam = new Map<string, typeof participants>();
    participants.forEach((participant) => {
      const key = participant.teamId.toString();
      if (!participantsByTeam.has(key)) {
        participantsByTeam.set(key, []);
      }
      participantsByTeam.get(key)!.push(participant);
    });

    const result = teams.map((team) => ({
      id: team._id.toString(),
      name: team.name,
      memberCount: team.memberCount,
      femaleCount: team.femaleCount,
      createdAt: team.createdAt,
      members: (participantsByTeam.get(team._id.toString()) ?? []).map(
        (participant) => ({
          id: participant._id.toString(),
          name: participant.name,
          email: participant.email,
          registrationId: participant.registrationId,
          phone: participant.phone,
          gender: participant.gender,
        }),
      ),
    }));

    return NextResponse.json({ teams: result });
  } catch (error) {
    console.error("GET /api/admin/teams failed:", error);
    return NextResponse.json(
      { error: "Failed to load teams" },
      { status: 500 },
    );
  }
}
