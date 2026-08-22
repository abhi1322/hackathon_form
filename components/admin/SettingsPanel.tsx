"use client";

import { Loader2, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { AdminTabPanel } from "@/components/admin/AdminTabs";
import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
} from "@/components/ui/form";
import type { PublicConfig } from "@/lib/public-config";

interface SettingsPanelProps {
  onUpdated: () => void;
  embedded?: boolean;
}

type SectionId = "rules" | "problemStatements" | "formContent";

type SectionStatus = {
  saving: boolean;
  message: string | null;
  error: string | null;
};

const INITIAL_SECTION_STATUS: SectionStatus = {
  saving: false,
  message: null,
  error: null,
};

function SettingsSection({
  title,
  description,
  children,
  saveLabel,
  status,
  onSave,
}: {
  title: string;
  description: string;
  children: ReactNode;
  saveLabel: string;
  status: SectionStatus;
  onSave: () => void;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
        <p className="text-sm text-text-muted">{description}</p>
      </div>

      {children}

      {status.message && (
        <p className="text-sm text-success">{status.message}</p>
      )}
      {status.error && <p className="text-sm text-error">{status.error}</p>}

      <Button type="button" disabled={status.saving} onClick={onSave}>
        {status.saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          saveLabel
        )}
      </Button>
    </Card>
  );
}

function formatValidationError(data: {
  error?: string;
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
}): string {
  const fieldMessages = Object.entries(data.details?.fieldErrors ?? {})
    .flatMap(([field, messages]) =>
      (messages ?? []).map((message) => `${field}: ${message}`),
    )
    .join("; ");

  if (fieldMessages) return fieldMessages;

  const formErrors = data.details?.formErrors?.join("; ");
  if (formErrors) return formErrors;

  return data.error ?? "Failed to save settings";
}

export function SettingsPanel({ onUpdated, embedded = false }: SettingsPanelProps) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bulkProblemStatements, setBulkProblemStatements] = useState("");
  const [sectionStatus, setSectionStatus] = useState<
    Record<SectionId, SectionStatus>
  >({
    rules: { ...INITIAL_SECTION_STATUS },
    problemStatements: { ...INITIAL_SECTION_STATUS },
    formContent: { ...INITIAL_SECTION_STATUS },
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/admin/config");
        if (!response.ok) throw new Error("Failed to load config");
        setConfig(await response.json());
      } catch {
        setLoadError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  function updateSectionStatus(
    section: SectionId,
    patch: Partial<SectionStatus>,
  ) {
    setSectionStatus((current) => ({
      ...current,
      [section]: { ...current[section], ...patch },
    }));
  }

  async function saveSection(
    section: SectionId,
    payload: Record<string, unknown>,
    options?: { clearBulk?: boolean },
  ) {
    if (!config) return;

    updateSectionStatus(section, {
      saving: true,
      message: null,
      error: null,
    });

    try {
      const response = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        updateSectionStatus(section, {
          saving: false,
          error: formatValidationError(data),
        });
        return;
      }

      setConfig(data);
      if (options?.clearBulk) {
        setBulkProblemStatements("");
      }
      updateSectionStatus(section, {
        saving: false,
        message: "Saved successfully",
      });
      onUpdated();
    } catch {
      updateSectionStatus(section, {
        saving: false,
        error: "Failed to save settings",
      });
    }
  }

  function saveRulesSection() {
    if (!config) return;

    saveSection("rules", {
      minTeamSize: config.minTeamSize,
      maxTeamSize: config.maxTeamSize,
      minFemaleMembers: config.minFemaleMembers,
      allowedEmailDomain: config.allowedEmailDomain,
      registrationOpen: config.registrationOpen,
    });
  }

  function saveProblemStatementsSection() {
    if (!config) return;

    saveSection(
      "problemStatements",
      {
        problemStatements: config.problemStatements ?? [],
        bulkProblemStatements: bulkProblemStatements.trim() || undefined,
      },
      { clearBulk: true },
    );
  }

  function saveFormContentSection() {
    if (!config) return;

    saveSection("formContent", {
      formEyebrow: config.formEyebrow,
      formTitle: config.formTitle,
      formDescription: config.formDescription,
      closedTitle: config.closedTitle,
      closedMessage: config.closedMessage,
      successTitle: config.successTitle,
      successMessage: config.successMessage,
      submitButtonText: config.submitButtonText,
    });
  }

  const formContent = (
    <div className="space-y-6">
      <SettingsSection
        title="Registration Rules"
        description="Team size limits, email domain, and open/close registration."
        saveLabel="Save Registration Rules"
        status={sectionStatus.rules}
        onSave={saveRulesSection}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="minTeamSize">Minimum Team Size</Label>
            <Input
              id="minTeamSize"
              type="number"
              min={1}
              value={config?.minTeamSize ?? ""}
              onChange={(event) =>
                config &&
                setConfig({
                  ...config,
                  minTeamSize: Number(event.target.value),
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="maxTeamSize">Maximum Team Size</Label>
            <Input
              id="maxTeamSize"
              type="number"
              min={1}
              value={config?.maxTeamSize ?? ""}
              onChange={(event) =>
                config &&
                setConfig({
                  ...config,
                  maxTeamSize: Number(event.target.value),
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="minFemaleMembers">Minimum Female Members</Label>
            <Input
              id="minFemaleMembers"
              type="number"
              min={0}
              value={config?.minFemaleMembers ?? ""}
              onChange={(event) =>
                config &&
                setConfig({
                  ...config,
                  minFemaleMembers: Number(event.target.value),
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="allowedEmailDomain">Allowed Email Domain</Label>
            <Input
              id="allowedEmailDomain"
              value={config?.allowedEmailDomain ?? ""}
              onChange={(event) =>
                config &&
                setConfig({
                  ...config,
                  allowedEmailDomain: event.target.value,
                })
              }
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <input
              id="registrationOpen"
              type="checkbox"
              checked={config?.registrationOpen ?? false}
              onChange={(event) =>
                config &&
                setConfig({
                  ...config,
                  registrationOpen: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <Label htmlFor="registrationOpen" className="mb-0">
              Registration open
            </Label>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Problem Statements"
        description="Teams must select one statement during registration."
        saveLabel="Save Problem Statements"
        status={sectionStatus.problemStatements}
        onSave={saveProblemStatementsSection}
      >
        {(config?.problemStatements ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(config?.problemStatements ?? []).map((statement) => (
              <span
                key={statement}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-3 py-1.5 text-sm text-text"
              >
                {statement}
                <button
                  type="button"
                  className="rounded-full p-0.5 text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                  aria-label={`Remove ${statement}`}
                  onClick={() =>
                    config &&
                    setConfig({
                      ...config,
                      problemStatements: config.problemStatements.filter(
                        (item) => item !== statement,
                      ),
                    })
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No problem statements configured yet.
          </p>
        )}

        <div>
          <Label htmlFor="bulkProblemStatements">Add Problem Statements</Label>
          <Textarea
            id="bulkProblemStatements"
            placeholder="AI for Healthcare, Smart Campus, FinTech Innovation"
            value={bulkProblemStatements}
            onChange={(event) => setBulkProblemStatements(event.target.value)}
          />
          <p className="mt-1.5 text-xs text-text-muted">
            Separate multiple statements with commas.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Form Content"
        description="Edit the text shown on the public registration page."
        saveLabel="Save Form Content"
        status={sectionStatus.formContent}
        onSave={saveFormContentSection}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="formEyebrow">Eyebrow Label</Label>
            <Input
              id="formEyebrow"
              value={config?.formEyebrow ?? ""}
              onChange={(event) =>
                config &&
                setConfig({ ...config, formEyebrow: event.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="formTitle">Form Title</Label>
            <Input
              id="formTitle"
              value={config?.formTitle ?? ""}
              onChange={(event) =>
                config &&
                setConfig({ ...config, formTitle: event.target.value })
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="formDescription">Form Description</Label>
            <Textarea
              id="formDescription"
              value={config?.formDescription ?? ""}
              onChange={(event) =>
                config &&
                setConfig({ ...config, formDescription: event.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="submitButtonText">Submit Button Text</Label>
            <Input
              id="submitButtonText"
              value={config?.submitButtonText ?? ""}
              onChange={(event) =>
                config &&
                setConfig({
                  ...config,
                  submitButtonText: event.target.value,
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="closedTitle">Closed State Title</Label>
            <Input
              id="closedTitle"
              value={config?.closedTitle ?? ""}
              onChange={(event) =>
                config &&
                setConfig({ ...config, closedTitle: event.target.value })
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="closedMessage">Closed State Message</Label>
            <Textarea
              id="closedMessage"
              value={config?.closedMessage ?? ""}
              onChange={(event) =>
                config &&
                setConfig({ ...config, closedMessage: event.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="successTitle">Success State Title</Label>
            <Input
              id="successTitle"
              value={config?.successTitle ?? ""}
              onChange={(event) =>
                config &&
                setConfig({ ...config, successTitle: event.target.value })
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="successMessage">Success State Message</Label>
            <Textarea
              id="successMessage"
              value={config?.successMessage ?? ""}
              onChange={(event) =>
                config &&
                setConfig({ ...config, successMessage: event.target.value })
              }
            />
            <p className="mt-1.5 text-xs text-text-muted">
              Use {"{teamName}"} to insert the registered team name.
            </p>
          </div>
        </div>
      </SettingsSection>
    </div>
  );

  if (loading) {
    const loadingState = (
      <div className="flex items-center gap-2 text-text-muted py-6">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading settings...
      </div>
    );

    if (embedded) {
      return (
        <AdminTabPanel
          title="Settings"
          description="Configure registration rules and public form copy."
        >
          {loadingState}
        </AdminTabPanel>
      );
    }

    return <Card>{loadingState}</Card>;
  }

  if (!config) {
    const errorState = (
      <p className="text-error text-sm">{loadError ?? "Settings unavailable"}</p>
    );

    if (embedded) {
      return (
        <AdminTabPanel
          title="Settings"
          description="Configure registration rules and public form copy."
        >
          {errorState}
        </AdminTabPanel>
      );
    }

    return <Card>{errorState}</Card>;
  }

  if (embedded) {
    return (
      <AdminTabPanel
        title="Settings"
        description="Configure registration rules and public form copy."
      >
        {formContent}
      </AdminTabPanel>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-text mb-1">
        Registration Settings
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Configure team rules, form copy, and registration status.
      </p>
      {formContent}
    </Card>
  );
}
