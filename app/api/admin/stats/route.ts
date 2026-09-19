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

    const totalSelectedTeams = teams.filter((team) => Boolean(team.selected)).length;

    const teamsMeetingQuota = teams.filter(
      (team) => team.femaleCount >= config.minFemaleMembers,
    ).length;
    const teamsNotMeetingQuota = totalTeams - teamsMeetingQuota;

    // Map participants by teamId
    const participantsByTeam = new Map<
      string,
      Array<{
        id: string;
        name: string;
        email: string;
        registrationId: string;
        phone: string;
        gender: "Male" | "Female" | "Other";
      }>
    >();

    for (const p of participants) {
      const tId = p.teamId.toString();
      if (!participantsByTeam.has(tId)) {
        participantsByTeam.set(tId, []);
      }
      participantsByTeam.get(tId)!.push({
        id: p._id.toString(),
        name: p.name,
        email: p.email,
        registrationId: p.registrationId,
        phone: p.phone,
        gender: p.gender as "Male" | "Female" | "Other",
      });
    }

    // Aggregate statistics per Problem Statement
    const configuredStatements = Array.isArray(config.problemStatements)
      ? config.problemStatements
      : [];

    type PSTeam = {
      id: string;
      name: string;
      selected: boolean;
      memberCount: number;
      femaleCount: number;
      createdAt: Date;
      members: Array<{
        id: string;
        name: string;
        email: string;
        registrationId: string;
        phone: string;
        gender: "Male" | "Female" | "Other";
      }>;
    };

    type PSStat = {
      id: string;
      psNumber: string;
      title: string;
      category: string;
      theme: string;
      organization: string;
      totalTeams: number;
      selectedTeams: number;
      teams: PSTeam[];
    };

    const statsMap = new Map<string, PSStat>();

    for (const statement of configuredStatements) {
      const id = statement.psNumber?.trim() || statement.title?.trim() || "";
      if (!id) continue;
      statsMap.set(id.toLowerCase(), {
        id,
        psNumber: statement.psNumber?.trim() ?? "",
        title: statement.title?.trim() ?? "",
        category: statement.category?.trim() ?? "",
        theme: statement.theme?.trim() ?? "",
        organization: statement.organization?.trim() ?? "",
        totalTeams: 0,
        selectedTeams: 0,
        teams: [],
      });
    }

    for (const team of teams) {
      const rawPs = (team.problemStatement ?? "").trim();
      if (!rawPs) continue;

      // Try matching by configured statements first
      const matched = configuredStatements.find((stmt) => {
        const stmtNum = stmt.psNumber?.trim().toLowerCase();
        const stmtTitle = stmt.title?.trim().toLowerCase();
        const target = rawPs.toLowerCase();
        return (stmtNum && stmtNum === target) || (stmtTitle && stmtTitle === target);
      });

      const key = matched
        ? (matched.psNumber?.trim() || matched.title?.trim() || "").toLowerCase()
        : rawPs.toLowerCase();

      let stat = statsMap.get(key);
      if (!stat) {
        stat = {
          id: rawPs,
          psNumber: "",
          title: rawPs,
          category: "",
          theme: "",
          organization: "",
          totalTeams: 0,
          selectedTeams: 0,
          teams: [],
        };
        statsMap.set(key, stat);
      }

      stat.totalTeams += 1;
      if (team.selected) {
        stat.selectedTeams += 1;
      }

      stat.teams.push({
        id: team._id.toString(),
        name: team.name,
        selected: Boolean(team.selected),
        memberCount: team.memberCount,
        femaleCount: team.femaleCount,
        createdAt: team.createdAt,
        members: participantsByTeam.get(team._id.toString()) ?? [],
      });
    }

    // Sort: highest attempted teams first, then by title / psNumber
    const problemStatementStats = Array.from(statsMap.values()).sort((a, b) => {
      if (b.totalTeams !== a.totalTeams) {
        return b.totalTeams - a.totalTeams;
      }
      if (b.selectedTeams !== a.selectedTeams) {
        return b.selectedTeams - a.selectedTeams;
      }
      return (a.psNumber || a.title).localeCompare(b.psNumber || b.title);
    });

    return NextResponse.json({
      totalTeams,
      totalParticipants,
      femaleParticipants,
      femaleParticipationPercent,
      totalSelectedTeams,
      teamsMeetingQuota,
      teamsNotMeetingQuota,
      minFemaleMembers: config.minFemaleMembers,
      problemStatementStats,
    });
  } catch (error) {
    console.error("GET /api/admin/stats failed:", error);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 },
    );
  }
}
