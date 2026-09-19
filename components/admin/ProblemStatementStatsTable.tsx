"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import type {
  ProblemStatementStat,
  PSTeamSummary,
} from "@/components/admin/StatsCards";
import { Button, Input } from "@/components/ui/form";

interface ProblemStatementStatsTableProps {
  stats: ProblemStatementStat[];
  totalTeams: number;
  onRefresh?: () => void;
}

type FilterType = "attempted" | "all" | "selected";

export function ProblemStatementStatsTable({
  stats,
  totalTeams,
  onRefresh,
}: ProblemStatementStatsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("attempted");
  const [expandedPS, setExpandedPS] = useState<Set<string>>(new Set());
  const [togglingTeamId, setTogglingTeamId] = useState<string | null>(null);

  const attemptedCount = useMemo(
    () => stats.filter((item) => item.totalTeams > 0).length,
    [stats],
  );

  const selectedCount = useMemo(
    () => stats.filter((item) => item.selectedTeams > 0).length,
    [stats],
  );

  const filteredStats = useMemo(() => {
    let list = stats;

    if (filterType === "attempted") {
      list = list.filter((item) => item.totalTeams > 0);
    } else if (filterType === "selected") {
      list = list.filter((item) => item.selectedTeams > 0);
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.trim().toLowerCase();
    return list.filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(query);
      const matchPsNum = item.psNumber?.toLowerCase().includes(query);
      const matchCategory = item.category?.toLowerCase().includes(query);
      const matchTheme = item.theme?.toLowerCase().includes(query);
      const matchOrg = item.organization?.toLowerCase().includes(query);
      // Also search through team names and participant names/emails
      const matchTeams = item.teams?.some(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.members.some(
            (m) =>
              m.name.toLowerCase().includes(query) ||
              m.email.toLowerCase().includes(query) ||
              m.registrationId.toLowerCase().includes(query),
          ),
      );
      return (
        matchTitle ||
        matchPsNum ||
        matchCategory ||
        matchTheme ||
        matchOrg ||
        matchTeams
      );
    });
  }, [stats, filterType, searchQuery]);

  // Grand totals of filtered items
  const totals = useMemo(() => {
    return filteredStats.reduce(
      (acc, curr) => {
        acc.participated += curr.totalTeams;
        acc.selected += curr.selectedTeams;
        return acc;
      },
      { participated: 0, selected: 0 },
    );
  }, [filteredStats]);

  function togglePS(id: string) {
    setExpandedPS((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleExpandAll() {
    if (expandedPS.size > 0) {
      setExpandedPS(new Set());
    } else {
      setExpandedPS(
        new Set(
          filteredStats
            .filter((s) => s.totalTeams > 0)
            .map((item) => item.id || item.title),
        ),
      );
    }
  }

  async function handleToggleTeamSelected(
    teamId: string,
    currentSelected: boolean,
  ) {
    setTogglingTeamId(teamId);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected: !currentSelected }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to update team selection");
        return;
      }

      onRefresh?.();
    } catch {
      alert("Failed to update team selection status");
    } finally {
      setTogglingTeamId(null);
    }
  }

  function handleExportSummaryExcel() {
    const rows = filteredStats.map((item, index) => ({
      "S.No.": index + 1,
      "PS Number": item.psNumber || "—",
      "Problem Statement Title": item.title,
      Category: item.category || "—",
      Theme: item.theme || "—",
      Organization: item.organization || "—",
      "Total number of teams Participated against each PS": item.totalTeams,
      "Total number of teams Selected against each PS": item.selectedTeams,
      "Selection Rate (%)":
        item.totalTeams > 0
          ? `${Math.round((item.selectedTeams / item.totalTeams) * 100)}%`
          : "0%",
    }));

    rows.push({
      "S.No.": "",
      "PS Number": "",
      "Problem Statement Title": "GRAND TOTAL",
      Category: "",
      Theme: "",
      Organization: "",
      "Total number of teams Participated against each PS": totals.participated,
      "Total number of teams Selected against each PS": totals.selected,
      "Selection Rate (%)":
        totals.participated > 0
          ? `${Math.round((totals.selected / totals.participated) * 100)}%`
          : "0%",
    } as unknown as (typeof rows)[0]);

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 46 },
      { wch: 18 },
      { wch: 20 },
      { wch: 26 },
      { wch: 28 },
      { wch: 26 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Problem Statement Stats",
    );

    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(
      workbook,
      `problem-statement-participation-stats-${dateStamp}.xlsx`,
    );
  }

  function handleExportDetailedExcel() {
    const rows: Array<{
      "S.No.": number;
      "PS Number": string;
      "Problem Statement Title": string;
      "Team Name": string;
      "Selection Status": string;
      "Participant Name": string;
      Gender: string;
      Email: string;
      Phone: string;
      "Registration ID": string;
    }> = [];

    let counter = 1;
    for (const ps of filteredStats) {
      const teams = ps.teams ?? [];
      for (const team of teams) {
        for (const member of team.members) {
          rows.push({
            "S.No.": counter++,
            "PS Number": ps.psNumber || "—",
            "Problem Statement Title": ps.title,
            "Team Name": team.name,
            "Selection Status": team.selected ? "Selected" : "Not Selected",
            "Participant Name": member.name,
            Gender: member.gender,
            Email: member.email,
            Phone: member.phone,
            "Registration ID": member.registrationId,
          });
        }
      }
    }

    if (rows.length === 0) {
      alert("No participant data found for export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 38 },
      { wch: 24 },
      { wch: 16 },
      { wch: 24 },
      { wch: 12 },
      { wch: 30 },
      { wch: 16 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Teams & Participants",
    );

    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(
      workbook,
      `hackathon-teams-participants-by-ps-${dateStamp}.xlsx`,
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      {/* Header section */}
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold tracking-tight text-text">
                Problem Statements (PS) Breakdown
              </h3>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Participation summary and detailed team roster with student names, genders, and emails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 gap-1.5 px-3 text-xs"
              onClick={toggleExpandAll}
              title="Expand or collapse teams for all problem statements"
            >
              <Users className="h-3.5 w-3.5" />
              {expandedPS.size > 0 ? "Collapse All" : "Expand All Teams"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 gap-1.5 px-3 text-xs"
              onClick={handleExportSummaryExcel}
              disabled={filteredStats.length === 0}
              title="Download problem statement participation summary"
            >
              <Download className="h-3.5 w-3.5" />
              Export Summary
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 gap-1.5 px-3 text-xs"
              onClick={handleExportDetailedExcel}
              disabled={filteredStats.length === 0}
              title="Download complete report with teams, participants, genders, and emails"
            >
              <Download className="h-3.5 w-3.5" />
              Export Detailed (with Mails & Genders)
            </Button>
          </div>
        </div>

        {/* Filter controls and search bar */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-bg/60 p-1">
            <button
              type="button"
              onClick={() => setFilterType("attempted")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filterType === "attempted"
                  ? "bg-surface text-text shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Attempted by Teams ({attemptedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filterType === "all"
                  ? "bg-surface text-text shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              All Configured ({stats.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("selected")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filterType === "selected"
                  ? "bg-surface text-text shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Selected Teams ({selectedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search PS, team, student, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-bg text-left text-text-muted">
            <tr>
              <th className="w-12 px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">
                Problem Statements (PS) attempted by teams
              </th>
              <th className="w-48 px-4 py-3 font-medium text-center">
                Total number of teams Participated against each PS
              </th>
              <th className="w-44 px-4 py-3 font-medium text-center">
                Total number of teams Selected against each PS
              </th>
              <th className="w-28 px-4 py-3 font-medium text-center">
                Selection Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-text-muted"
                >
                  {searchQuery
                    ? `No problem statements match "${searchQuery}".`
                    : filterType === "attempted"
                      ? "No problem statements have been attempted by registered teams yet."
                      : filterType === "selected"
                        ? "No teams have been selected for any problem statement yet."
                        : "No problem statements available."}
                </td>
              </tr>
            ) : (
              filteredStats.map((item, index) => {
                const psKey = item.id || item.title;
                const isExpanded = expandedPS.has(psKey);
                const teams = item.teams ?? [];
                const percentOfAllTeams =
                  totalTeams > 0
                    ? Math.round((item.totalTeams / totalTeams) * 100)
                    : 0;
                const selectionRate =
                  item.totalTeams > 0
                    ? Math.round(
                        (item.selectedTeams / item.totalTeams) * 100,
                      )
                    : 0;

                return (
                  <tr key={psKey || index} className="border-t border-border">
                    <td
                      colSpan={5}
                      className="p-0 hover:bg-bg/40 transition-colors"
                    >
                      <div className="flex flex-col">
                        {/* Main PS Row */}
                        <div className="flex items-center px-4 py-3.5 gap-2">
                          <div className="w-8 shrink-0 text-xs text-text-muted font-medium">
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0 pr-4">
                            <button
                              type="button"
                              onClick={() => togglePS(psKey)}
                              className="text-left group flex items-start gap-2 w-full"
                            >
                              <span className="mt-0.5 shrink-0 text-text-muted transition-transform duration-150">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-primary" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 group-hover:text-text" />
                                )}
                              </span>
                              <div>
                                <p className="font-semibold text-text text-sm leading-snug group-hover:text-primary transition-colors">
                                  {item.title}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {item.psNumber && (
                                    <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                      {item.psNumber}
                                    </span>
                                  )}
                                  {item.category && (
                                    <span className="inline-flex items-center rounded-md border border-border bg-bg px-2 py-0.5 text-[11px] text-text-muted">
                                      {item.category}
                                    </span>
                                  )}
                                  {item.theme && (
                                    <span className="inline-flex items-center rounded-md border border-border bg-bg px-2 py-0.5 text-[11px] text-text-muted">
                                      {item.theme}
                                    </span>
                                  )}
                                  {item.organization && (
                                    <span className="inline-flex items-center rounded-md border border-border bg-bg px-2 py-0.5 text-[11px] text-text-muted">
                                      {item.organization}
                                    </span>
                                  )}
                                  {teams.length > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                      <Users className="h-3 w-3" />
                                      {teams.length} team{teams.length === 1 ? "" : "s"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>

                          <div className="w-48 shrink-0 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-base font-bold text-text">
                                {item.totalTeams}
                              </span>
                              {item.totalTeams > 0 && totalTeams > 0 && (
                                <span className="text-[11px] text-text-muted">
                                  {percentOfAllTeams}% of total
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="w-44 shrink-0 text-center">
                            <div className="inline-flex flex-col items-center">
                              {item.selectedTeams > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {item.selectedTeams} Selected
                                </span>
                              ) : (
                                <span className="text-xs text-text-muted">0</span>
                              )}
                            </div>
                          </div>

                          <div className="w-28 shrink-0 text-center">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                selectionRate > 0
                                  ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                                  : "text-text-muted"
                              }`}
                            >
                              {item.totalTeams > 0 ? `${selectionRate}%` : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Section: Teams with Participants, Genders, and Emails */}
                        {isExpanded && (
                          <div className="border-t border-border/80 bg-bg/50 px-6 py-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-primary" />
                                Teams & Participants for this Problem Statement ({teams.length})
                              </h4>
                              <span className="text-xs text-text-muted">
                                Click Select/Deselect to manage finalists
                              </span>
                            </div>

                            {teams.length === 0 ? (
                              <div className="rounded-lg border border-border bg-surface p-4 text-center text-xs text-text-muted">
                                No teams have registered for this problem statement yet.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {teams.map((team) => (
                                  <div
                                    key={team.id}
                                    className="rounded-[var(--radius-md)] border border-border bg-surface shadow-2xs overflow-hidden"
                                  >
                                    {/* Team header bar */}
                                    <div className="flex flex-col gap-2 border-b border-border bg-bg/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex items-center gap-2.5">
                                        <span className="font-semibold text-text text-sm">
                                          {team.name}
                                        </span>

                                        {team.selected ? (
                                          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Selected
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center rounded-full border border-border bg-bg px-2 py-0.5 text-xs text-text-muted">
                                            Not Selected
                                          </span>
                                        )}

                                        <span className="text-xs text-text-muted">
                                          {team.members.length} members ({team.femaleCount} female)
                                        </span>
                                      </div>

                                      <Button
                                        type="button"
                                        variant={team.selected ? "secondary" : "ghost"}
                                        className="h-7 px-2.5 text-xs self-start sm:self-auto"
                                        disabled={togglingTeamId === team.id}
                                        onClick={() =>
                                          handleToggleTeamSelected(
                                            team.id,
                                            team.selected,
                                          )
                                        }
                                        title={
                                          team.selected
                                            ? "Deselect this team"
                                            : "Mark team as selected"
                                        }
                                      >
                                        {togglingTeamId === team.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : team.selected ? (
                                          "Deselect Team"
                                        ) : (
                                          "Select Team"
                                        )}
                                      </Button>
                                    </div>

                                    {/* Participants Table with Genders and Emails */}
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full text-xs">
                                        <thead className="bg-bg/30 text-text-muted text-left">
                                          <tr>
                                            <th className="px-4 py-2 font-medium">Participant Name</th>
                                            <th className="px-4 py-2 font-medium">Gender</th>
                                            <th className="px-4 py-2 font-medium">Email</th>
                                            <th className="px-4 py-2 font-medium">Registration ID</th>
                                            <th className="px-4 py-2 font-medium">Phone</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                          {team.members.map((member, mIdx) => {
                                            const isFemale =
                                              member.gender === "Female";
                                            return (
                                              <tr
                                                key={member.id || mIdx}
                                                className="hover:bg-bg/30 transition-colors"
                                              >
                                                <td className="px-4 py-2.5 font-medium text-text">
                                                  <div className="flex items-center gap-1.5">
                                                    {mIdx === 0 && (
                                                      <span className="rounded bg-primary/10 px-1 py-0.2 text-[10px] font-bold text-primary">
                                                        Leader
                                                      </span>
                                                    )}
                                                    {member.name}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                  <span
                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                                      isFemale
                                                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                                        : "border border-border bg-bg text-text-muted"
                                                    }`}
                                                  >
                                                    {member.gender}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                  <a
                                                    href={`mailto:${member.email}`}
                                                    className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                                                    title={`Send email to ${member.email}`}
                                                  >
                                                    <Mail className="h-3 w-3 text-text-muted shrink-0" />
                                                    {member.email}
                                                  </a>
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-text-muted">
                                                  {member.registrationId}
                                                </td>
                                                <td className="px-4 py-2.5 text-text-muted">
                                                  {member.phone}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Grand total summary footer row */}
          {filteredStats.length > 0 && (
            <tfoot className="border-t-2 border-border bg-bg/70 font-semibold text-text">
              <tr>
                <td className="px-4 py-3.5 text-xs text-text-muted"></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span>Grand Total</span>
                    <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-normal text-text-muted">
                      {filteredStats.length} Problem Statement
                      {filteredStats.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center text-base font-bold text-text">
                  {totals.participated}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
                    {totals.selected} Selected
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center text-xs text-text-muted">
                  {totals.participated > 0
                    ? `${Math.round((totals.selected / totals.participated) * 100)}%`
                    : "0%"}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
