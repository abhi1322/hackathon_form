"use client";

import { Download, Loader2, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { StatsCards } from "@/components/admin/StatsCards";
import { TeamsTable } from "@/components/admin/TeamsTable";
import { Button } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import type { PublicConfig } from "@/lib/models/Config";
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

export function AdminDashboard() {
  const router = useRouter();
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
    const timeout = setTimeout(() => {
      loadDashboard(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, loadDashboard]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function handleDownloadStart() {
    setExporting(true);
    window.setTimeout(() => setExporting(false), 2000);
  }

  return (
    <div className="page-shell mx-auto max-w-[1200px] px-4 py-8 sm:py-10">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="accent-bar mb-4" />
          <h1 className="text-3xl font-semibold tracking-tight text-text">
            Admin Dashboard
          </h1>
          <p className="text-text-muted mt-2">
            Manage registered teams and registration settings.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="space-y-8">
        <StatsCards stats={stats} />

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-text">
              Registered Teams
            </h2>
            <div className="flex items-center gap-3">
              <a
                href="/api/admin/teams/export"
                onClick={handleDownloadStart}
                aria-disabled={exporting}
                className={cn(
                  "inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border bg-surface text-text hover:bg-bg",
                  exporting && "pointer-events-none opacity-50",
                )}
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
              </a>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
              )}
            </div>
          </div>
          <TeamsTable
            teams={teams}
            config={config}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={() => loadDashboard(searchQuery)}
          />
        </section>

        <SettingsPanel onUpdated={() => loadDashboard(searchQuery)} />
      </div>
    </div>
  );
}
