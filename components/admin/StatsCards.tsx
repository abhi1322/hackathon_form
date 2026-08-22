"use client";

interface StatsData {
  totalTeams: number;
  totalParticipants: number;
  femaleParticipants: number;
  femaleParticipationPercent: number;
  teamsMeetingQuota: number;
  teamsNotMeetingQuota: number;
  minFemaleMembers: number;
}

export function StatsCards({ stats }: { stats: StatsData | null }) {
  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface"
          />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Teams", value: stats.totalTeams },
    { label: "Total Participants", value: stats.totalParticipants },
    {
      label: "Female Participation",
      value: `${stats.femaleParticipationPercent}%`,
    },
    {
      label: "Quota Audit",
      value: `${stats.teamsMeetingQuota} ok / ${stats.teamsNotMeetingQuota} short`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-1)]"
        >
          <p className="text-sm text-text-muted">{card.label}</p>
          <p className="mt-1 font-display text-2xl font-medium text-text">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
