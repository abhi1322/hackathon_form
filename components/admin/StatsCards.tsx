"use client";

import {
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";

export interface PSTeamMember {
  id: string;
  name: string;
  email: string;
  registrationId: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
}

export interface PSTeamSummary {
  id: string;
  name: string;
  selected: boolean;
  memberCount: number;
  femaleCount: number;
  createdAt: string | Date;
  members: PSTeamMember[];
}

export interface ProblemStatementStat {
  id: string;
  psNumber: string;
  title: string;
  category: string;
  theme: string;
  organization: string;
  totalTeams: number;
  selectedTeams: number;
  teams?: PSTeamSummary[];
}

export interface StatsData {
  totalTeams: number;
  totalParticipants: number;
  femaleParticipants: number;
  femaleParticipationPercent: number;
  totalSelectedTeams: number;
  teamsMeetingQuota: number;
  teamsNotMeetingQuota: number;
  minFemaleMembers: number;
  problemStatementStats: ProblemStatementStat[];
}

export function StatsCards({ stats }: { stats: StatsData | null }) {
  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface"
          />
        ))}
      </div>
    );
  }

  const selectedCount = stats.totalSelectedTeams ?? 0;
  const selectionRate =
    stats.totalTeams > 0
      ? Math.round((selectedCount / stats.totalTeams) * 100)
      : 0;

  const cards = [
    {
      id: "teams",
      label: "Total no. of Teams Participated",
      value: stats.totalTeams,
      subtext: `${stats.totalTeams === 1 ? "1 team" : `${stats.totalTeams} teams`} registered`,
      icon: Users,
      iconClass: "text-blue-600 bg-blue-500/10",
    },
    {
      id: "students",
      label: "Total no. of Students Participated",
      value: stats.totalParticipants,
      subtext: "Total student registrations",
      icon: GraduationCap,
      iconClass: "text-indigo-600 bg-indigo-500/10",
    },
    {
      id: "female",
      label: "No. of female Participants",
      value: stats.femaleParticipants,
      badge: `${stats.femaleParticipationPercent}%`,
      subtext: `${stats.femaleParticipationPercent}% of all participants`,
      icon: UserCheck,
      iconClass: "text-emerald-600 bg-emerald-500/10",
    },
    {
      id: "selected",
      label: "Total Teams Selected",
      value: selectedCount,
      badge: selectedCount > 0 ? `${selectionRate}%` : undefined,
      subtext:
        selectedCount > 0
          ? `${selectionRate}% of registered teams`
          : "No teams selected yet",
      icon: Trophy,
      iconClass: "text-amber-600 bg-amber-500/10",
    },
    {
      id: "quota",
      label: "Female Quota Compliance",
      value: `${stats.teamsMeetingQuota}/${stats.totalTeams}`,
      subtext:
        stats.teamsNotMeetingQuota > 0
          ? `${stats.teamsNotMeetingQuota} short (min ${stats.minFemaleMembers} required)`
          : "All teams meet female quota",
      badge: stats.teamsNotMeetingQuota === 0 && stats.totalTeams > 0 ? "100%" : undefined,
      icon: ShieldCheck,
      iconClass:
        stats.teamsNotMeetingQuota > 0
          ? "text-amber-600 bg-amber-500/10"
          : "text-emerald-600 bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="flex flex-col justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-all duration-[var(--duration-fast)] hover:border-border/80 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-text-muted leading-snug">
                {card.label}
              </span>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-text">
                  {card.value}
                </span>
                {card.badge && (
                  <span className="inline-flex items-center rounded-full border border-border bg-bg px-2 py-0.5 text-[11px] font-medium text-text-muted">
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-muted line-clamp-1">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
