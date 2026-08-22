"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/cn";

interface ConstraintBarProps {
  memberCount: number;
  minTeamSize: number;
  maxTeamSize: number;
  femaleCount: number;
  minFemaleMembers: number;
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
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-text-muted" />
      )}
      <span className={cn(ok ? "text-text" : "text-text-muted")}>{label}</span>
    </li>
  );
}

export function ConstraintBar({
  memberCount,
  minTeamSize,
  maxTeamSize,
  femaleCount,
  minFemaleMembers,
  isFormValid,
}: ConstraintBarProps) {
  const memberCountOk =
    memberCount >= minTeamSize && memberCount <= maxTeamSize;
  const femaleCountOk = femaleCount >= minFemaleMembers;

  return (
    <div className="sticky bottom-4 z-10 rounded-full border border-border bg-surface/95 backdrop-blur-sm px-5 py-4 shadow-[var(--shadow-soft)]">
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
        <StatusItem
          ok={memberCountOk}
          label={`Members ${memberCount}/${minTeamSize}–${maxTeamSize}`}
        />
        <StatusItem
          ok={femaleCountOk}
          label={`Female ${femaleCount}/${minFemaleMembers} min`}
        />
        <StatusItem
          ok={isFormValid && memberCountOk && femaleCountOk}
          label="Ready to submit"
        />
      </ul>
    </div>
  );
}
