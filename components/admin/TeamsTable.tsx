"use client";

import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { Button, Input } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import type { PublicConfig } from "@/lib/models/Config";
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
    <>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-1)] overflow-hidden">
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
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Female</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
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
                              variant="ghost"
                              onClick={() => setEditingTeam(team)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              disabled={deletingId === team.id}
                              onClick={() => handleDelete(team)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-t border-border bg-bg/40">
                          <td colSpan={5} className="px-4 py-4">
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
      </div>

      {editingTeam && config && (
        <EditTeamModal
          team={editingTeam}
          config={config}
          onClose={() => setEditingTeam(null)}
          onSaved={onRefresh}
        />
      )}
    </>
  );
}
