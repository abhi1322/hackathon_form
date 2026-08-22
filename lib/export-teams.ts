import { Participant } from "@/lib/models/Participant";
import { Team } from "@/lib/models/Team";

export interface ExportTeamRow {
  teamName: string;
  problemStatement: string;
  studentName: string;
  email: string;
  phone: string;
}

export async function getAllTeamsForExport(): Promise<ExportTeamRow[]> {
  const teams = await Team.find().sort({ createdAt: -1 }).lean();
  const teamIds = teams.map((team) => team._id);

  const participants = await Participant.find({
    teamId: { $in: teamIds },
  }).lean();

  const teamNameById = new Map(
    teams.map((team) => [team._id.toString(), team.name]),
  );
  const problemStatementById = new Map(
    teams.map((team) => [
      team._id.toString(),
      team.problemStatement ?? "",
    ]),
  );

  const rows: ExportTeamRow[] = [];

  for (const team of teams) {
    const teamMembers = participants.filter(
      (participant) => participant.teamId.toString() === team._id.toString(),
    );

    for (const member of teamMembers) {
      rows.push({
        teamName: teamNameById.get(team._id.toString()) ?? team.name,
        problemStatement:
          problemStatementById.get(team._id.toString()) ??
          team.problemStatement ??
          "",
        studentName: member.name,
        email: member.email,
        phone: member.phone,
      });
    }
  }

  return rows;
}
