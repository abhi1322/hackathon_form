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
    <div className="sticky bottom-4 z-10 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-2)]">
      <p className="mb-3 text-sm font-medium text-text">
        Registration checklist
      </p>
      <ul className="space-y-2">
        <StatusItem
          ok={memberCountOk}
          label={`Members: ${memberCount} / ${minTeamSize}–${maxTeamSize} required`}
        />
        <StatusItem
          ok={femaleCountOk}
          label={`Female members: ${femaleCount} / ${minFemaleMembers} minimum`}
        />
        <StatusItem
          ok={isFormValid && memberCountOk && femaleCountOk}
          label="All fields valid and ready to submit"
        />
      </ul>
    </div>
  );
}
