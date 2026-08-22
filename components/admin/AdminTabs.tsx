"use client";

import { BarChart3, Settings, Users } from "lucide-react";
import { cn } from "@/lib/cn";

export type AdminTab = "overview" | "teams" | "settings";

const TABS: Array<{
  id: AdminTab;
  label: string;
  description: string;
  icon: typeof Users;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "Registration stats at a glance",
    icon: BarChart3,
  },
  {
    id: "teams",
    label: "Teams",
    description: "Search, edit, and export teams",
    icon: Users,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Rules and form content",
    icon: Settings,
  },
];

interface AdminTabsProps {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
}

export function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
  return (
    <div className="border-b border-border">
      <nav
        className="-mb-px flex gap-1 overflow-x-auto pb-px"
        aria-label="Admin sections"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex min-w-[9.5rem] shrink-0 items-center gap-2 rounded-t-[var(--radius-md)] border border-transparent px-4 py-3 text-left transition-colors duration-[var(--duration-fast)]",
                isActive
                  ? "border-border border-b-surface bg-surface text-text"
                  : "text-text-muted hover:bg-surface/70 hover:text-text",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-primary" : "text-text-muted",
                )}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{tab.label}</span>
                <span className="hidden text-xs text-text-muted sm:block">
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminTabPanel({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
