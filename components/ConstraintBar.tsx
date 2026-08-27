"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/cn";

interface ConstraintBarProps {
  memberCount: number;
  minTeamSize: number;
  maxTeamSize: number;
  femaleCount: number;
  minFemaleMembers: number;
  problemSelected: boolean;
  isFormValid: boolean;
}

function StatusItem({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-text-muted/70" />
      )}
      <span
        className={cn(
          "truncate transition-colors",
          ok ? "font-medium text-text" : "text-text-muted",
        )}
      >
        {label}
      </span>
    </li>
  );
}

export function ConstraintBar({
  memberCount,
  minTeamSize,
  maxTeamSize,
  femaleCount,
  minFemaleMembers,
  problemSelected,
  isFormValid,
}: ConstraintBarProps) {
  const memberCountOk =
    memberCount >= minTeamSize && memberCount <= maxTeamSize;
  const femaleCountOk = femaleCount >= minFemaleMembers;

  return (
    <div className="sticky bottom-4 z-10 rounded-2xl sm:rounded-full border border-border/80 bg-surface/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-3.5 shadow-md shadow-black/5">
      <ul className="grid grid-cols-2 gap-x-3 gap-y-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-2">
        <StatusItem
          ok={memberCountOk}
          label={`Members ${memberCount}/${minTeamSize}–${maxTeamSize}`}
        />
        <StatusItem
          ok={femaleCountOk}
          label={`Female ${femaleCount}/${minFemaleMembers} min`}
        />
        <StatusItem ok={problemSelected} label="Problem selected" />
        <StatusItem
          ok={isFormValid && memberCountOk && femaleCountOk && problemSelected}
          label="Ready to submit"
        />
      </ul>
    </div>
  );
}
