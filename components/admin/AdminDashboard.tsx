"use client";

import { Download, Loader2, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AdminTabPanel,
  AdminTabs,
  type AdminTab,
} from "@/components/admin/AdminTabs";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { StatsCards } from "@/components/admin/StatsCards";
import { TeamsTable } from "@/components/admin/TeamsTable";
import { Button } from "@/components/ui/form";
import type { PublicConfig } from "@/lib/public-config";
import type { TeamRecord } from "@/components/admin/EditTeamModal";

interface StatsData {
  totalTeams: number;
  totalParticipants: number;
  femaleParticipants: number;
  femaleParticipationPercent: number;
  teamsMeetingQuota: number;
  teamsNotMeetingQuota: number;
  minFemaleMembers: number;
}

function parseTab(value: string | null): AdminTab {
  if (value === "teams" || value === "settings" || value === "overview") {
    return value;
  }
  return "overview";
}

export function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    parseTab(searchParams.get("tab")),
  );
  const [stats, setStats] = useState<StatsData | null>(null);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadDashboard = useCallback(async (query = searchQuery) => {
    setLoading(true);
    try {
      const queryParam = query ? `?q=${encodeURIComponent(query)}` : "";
      const [statsRes, teamsRes, configRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/teams${queryParam}`),
        fetch("/api/admin/config"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams ?? []);
      }
      if (configRes.ok) setConfig(await configRes.json());
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    setActiveTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadDashboard(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, loadDashboard]);

  function handleTabChange(tab: AdminTab) {
    setActiveTab(tab);
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleDownloadStart() {
    setExporting(true);
    try {
      const response = await fetch("/api/admin/teams/export");
      if (!response.ok) {
        const text = await response.text();
        let message = "Failed to download export.";
        try {
          const json = JSON.parse(text);
          if (json.error) message = json.error;
        } catch {}
        alert(message);
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^"]+)"?/);
      const filename =
        match?.[1] ??
        `hackathon-teams-${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download export. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="page-shell mx-auto max-w-[1200px] px-4 py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="accent-bar mb-4" />
          <h1 className="text-3xl font-semibold tracking-tight text-text">
            Admin Dashboard
          </h1>
          <p className="text-text-muted mt-2">
            Manage teams, review stats, and configure registration.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="mb-6">
        <AdminTabs activeTab={activeTab} onChange={handleTabChange} />
      </div>

      <div className="space-y-6">
        {activeTab === "overview" && (
          <AdminTabPanel
            title="Overview"
            description="Key registration metrics and quota audit summary."
          >
            <StatsCards stats={stats} />
            {stats && (
              <p className="mt-5 text-sm text-text-muted">
                {stats.totalTeams} team{stats.totalTeams === 1 ? "" : "s"}{" "}
                registered with {stats.totalParticipants} total participants.
                {stats.teamsNotMeetingQuota > 0
                  ? ` ${stats.teamsNotMeetingQuota} team(s) are below the female quota minimum.`
                  : " All teams currently meet the female quota."}
              </p>
            )}
          </AdminTabPanel>
        )}

        {activeTab === "teams" && (
          <AdminTabPanel
            title="Registered Teams"
            description="Search teams, view member details, edit entries, or export data."
            actions={
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDownloadStart}
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Excel
                    </>
                  )}
                </Button>
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                )}
              </>
            }
          >
            <TeamsTable
              teams={teams}
              config={config}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRefresh={() => loadDashboard(searchQuery)}
            />
          </AdminTabPanel>
        )}

        {activeTab === "settings" && (
          <SettingsPanel onUpdated={() => loadDashboard(searchQuery)} embedded />
        )}
      </div>
    </div>
  );
}
