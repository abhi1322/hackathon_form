"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Fragment, useState } from "react";
import { Button, Input } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { resolveProblemStatementDisplay } from "@/lib/problem-statements";
import type { PublicConfig } from "@/lib/public-config";
import { EditTeamModal, type TeamRecord } from "@/components/admin/EditTeamModal";

interface TeamsTableProps {
  teams: TeamRecord[];
  config: PublicConfig | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export function TeamsTable({
  teams,
  config,
  searchQuery,
  onSearchChange,
  onRefresh,
}: TeamsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleSelected(team: TeamRecord) {
    setTogglingId(team.id);
    try {
      const nextSelected = !team.selected;
      const response = await fetch(`/api/admin/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected: nextSelected }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error ?? "Failed to update team selection");
        return;
      }

      onRefresh();
    } catch {
      alert("Failed to update team selection status");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(team: TeamRecord) {
    const confirmed = window.confirm(
      `Delete team "${team.name}" and all members? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(team.id);
    try {
      const response = await fetch(`/api/admin/teams/${team.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error ?? "Failed to delete team");
        return;
      }

      onRefresh();
    } catch {
      alert("Failed to delete team");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="border-b border-border p-4">
          <Input
            placeholder="Search by team name, member name, email, or registration ID"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-bg text-left text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Problem Statement</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Female</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    No teams found.
                  </td>
                </tr>
              ) : (
                teams.map((team) => {
                  const expanded = expandedId === team.id;
                  return (
                    <Fragment key={team.id}>
                      <tr
                        key={team.id}
                        className="border-t border-border hover:bg-bg/60"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-left font-medium text-text"
                            onClick={() =>
                              setExpandedId(expanded ? null : team.id)
                            }
                          >
                            {expanded ? (
                              <ChevronDown className="h-4 w-4 text-text-muted" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-text-muted" />
                            )}
                            {team.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-text-muted max-w-[18rem]">
                          <span className="line-clamp-2">
                            {resolveProblemStatementDisplay(
                              team.problemStatement,
                              config?.problemStatements ?? [],
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {team.selected ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              Selected
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-border bg-bg px-2.5 py-0.5 text-xs text-text-muted">
                              Not Selected
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">{team.memberCount}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              config &&
                                team.femaleCount < config.minFemaleMembers
                                ? "text-warning"
                                : "text-text",
                            )}
                          >
                            {team.femaleCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted">
                          {new Date(team.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={team.selected ? "secondary" : "ghost"}
                              className="h-8 px-2.5 text-xs"
                              disabled={togglingId === team.id}
                              onClick={() => handleToggleSelected(team)}
                              title={team.selected ? "Deselect team" : "Select team"}
                            >
                              {togglingId === team.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : team.selected ? (
                                "Deselect"
                              ) : (
                                "Select"
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => setEditingTeam(team)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              className="h-8 px-2.5 text-xs"
                              disabled={deletingId === team.id}
                              onClick={() => handleDelete(team)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-t border-border bg-bg/40">
                          <td colSpan={7} className="px-4 py-4">
                            {team.problemStatement && (
                              <p className="mb-3 text-sm text-text-muted">
                                <span className="font-medium text-text">
                                  Problem Statement:
                                </span>{" "}
                                {resolveProblemStatementDisplay(
                                  team.problemStatement,
                                  config?.problemStatements ?? [],
                                )}
                              </p>
                            )}
                            <div className="grid gap-3">
                              {team.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3"
                                >
                                  <p className="font-medium text-text">
                                    {member.name}
                                  </p>
                                  <p className="text-text-muted">
                                    {member.email} · {member.registrationId} ·{" "}
                                    {member.phone} · {member.gender}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      {editingTeam && config && (
        <EditTeamModal
          team={editingTeam}
          config={config}
          onClose={() => setEditingTeam(null)}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}
