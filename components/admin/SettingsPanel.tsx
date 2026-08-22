"use client";

import {
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AdminTabPanel } from "@/components/admin/AdminTabs";
import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
} from "@/components/ui/form";
import {
  countMergeStats,
  formatProblemStatementLabel,
  getProblemStatementId,
  mergeProblemStatements,
  normalizeProblemStatement,
  parseProblemStatementsFromRows,
  PROBLEM_STATEMENT_EXCEL_HEADERS,
  type ProblemStatement,
} from "@/lib/problem-statements";
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

const EMPTY_DRAFT: ProblemStatement = {
  serialNo: "",
  organization: "",
  title: "",
  category: "",
  psNumber: "",
  theme: "",
  deadline: "",
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

function MetaChip({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-2.5 py-0.5 text-xs text-text-muted">
      <span className="font-medium text-text">{label}</span>
      {value}
    </span>
  );
}

export function SettingsPanel({
  onUpdated,
  embedded = false,
}: SettingsPanelProps) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProblemStatement>({ ...EMPTY_DRAFT });
  const [draftError, setDraftError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    saveSection("problemStatements", {
      problemStatements: config.problemStatements ?? [],
    });
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

  function addManualStatement() {
    if (!config) return;

    const normalized = normalizeProblemStatement(draft);
    if (!normalized) {
      setDraftError("Title or PS Number is required.");
      return;
    }

    const existing = config.problemStatements ?? [];
    const stats = countMergeStats(existing, [normalized]);
    if (stats.duplicates > 0) {
      setDraftError(
        "This problem statement already exists (duplicate PS Number or title).",
      );
      return;
    }

    setConfig({
      ...config,
      problemStatements: mergeProblemStatements(existing, [normalized]),
    });
    setDraft({ ...EMPTY_DRAFT });
    setDraftError(null);
    setUploadSummary(null);
  }

  function removeStatement(statement: ProblemStatement) {
    if (!config) return;
    const targetId = getProblemStatementId(statement);
    setConfig({
      ...config,
      problemStatements: config.problemStatements.filter(
        (item) => getProblemStatementId(item) !== targetId,
      ),
    });
  }

  function downloadTemplate() {
    const worksheet = XLSX.utils.aoa_to_sheet([
      [...PROBLEM_STATEMENT_EXCEL_HEADERS],
      [
        "1",
        "Ministry of Development of North Eastern Region (MDoNER)",
        "AI-Based early warning and landslide Risk Monitoring System in NER",
        "Software",
        "SIH26001",
        "Disaster Management",
        "20-Sep-26",
      ],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Problem Statements");
    XLSX.writeFile(workbook, "problem-statements-template.xlsx");
  }

  async function handleExcelUpload(file: File) {
    if (!config) return;

    setUploadError(null);
    setUploadSummary(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setUploadError("The Excel file has no sheets.");
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (rows.length === 0) {
        setUploadError("No data rows found in the Excel file.");
        return;
      }

      const { statements, skippedEmpty } =
        parseProblemStatementsFromRows(rows);
      if (statements.length === 0) {
        setUploadError(
          "No valid problem statements found. Check that headers match the template.",
        );
        return;
      }

      const existing = config.problemStatements ?? [];
      const stats = countMergeStats(existing, statements);
      const merged = mergeProblemStatements(existing, statements);

      setConfig({
        ...config,
        problemStatements: merged,
      });

      const parts = [
        `Added ${stats.added}`,
        stats.duplicates > 0
          ? `skipped ${stats.duplicates} duplicate(s)`
          : null,
        skippedEmpty > 0 ? `ignored ${skippedEmpty} empty row(s)` : null,
      ].filter(Boolean);

      setUploadSummary(`${parts.join(", ")}. Click Save to persist.`);
    } catch (error) {
      console.error(error);
      setUploadError(
        "Failed to parse the Excel file. Use the provided template.",
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const formContent = config ? (
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
              value={config.minTeamSize}
              onChange={(event) =>
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
              value={config.maxTeamSize}
              onChange={(event) =>
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
              value={config.minFemaleMembers}
              onChange={(event) =>
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
              value={config.allowedEmailDomain}
              onChange={(event) =>
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
              checked={config.registrationOpen}
              onChange={(event) =>
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
        description="Teams must select one statement during registration. Add manually or upload from Excel."
        saveLabel="Save Problem Statements"
        status={sectionStatus.problemStatements}
        onSave={saveProblemStatementsSection}
      >
        {(config.problemStatements ?? []).length > 0 ? (
          <div className="space-y-3">
            {config.problemStatements.map((statement) => {
              const key = getProblemStatementId(statement);
              return (
                <div
                  key={key}
                  className="rounded-[var(--radius-md)] border border-border bg-bg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text leading-snug">
                        {statement.psNumber ? (
                          <>
                            <span className="text-primary">
                              {statement.psNumber}
                            </span>
                            <span className="text-text-muted"> — </span>
                          </>
                        ) : null}
                        {statement.title}
                      </p>
                      {statement.organization ? (
                        <p className="mt-1 text-xs text-text-muted leading-relaxed">
                          {statement.organization}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <MetaChip label="S.No." value={statement.serialNo} />
                        <MetaChip label="Category" value={statement.category} />
                        <MetaChip label="Theme" value={statement.theme} />
                        <MetaChip label="Deadline" value={statement.deadline} />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-[var(--radius-md)] p-2 text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                      aria-label={`Remove ${formatProblemStatementLabel(statement)}`}
                      onClick={() => removeStatement(statement)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No problem statements configured yet.
          </p>
        )}

        <div className="rounded-[var(--radius-md)] border border-border p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-text">Manual entry</h4>
            <p className="mt-1 text-xs text-text-muted">
              Fill the fields from the SIH Excel sheet, then add.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ps-serialNo">S.No.</Label>
              <Input
                id="ps-serialNo"
                value={draft.serialNo ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, serialNo: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="ps-psNumber">PS Number</Label>
              <Input
                id="ps-psNumber"
                placeholder="SIH26001"
                value={draft.psNumber}
                onChange={(event) =>
                  setDraft({ ...draft, psNumber: event.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ps-title">Problem Statement Title</Label>
              <Textarea
                id="ps-title"
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ps-organization">Organization</Label>
              <Input
                id="ps-organization"
                value={draft.organization}
                onChange={(event) =>
                  setDraft({ ...draft, organization: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="ps-category">Category</Label>
              <Input
                id="ps-category"
                placeholder="Software / Hardware"
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="ps-theme">Theme</Label>
              <Input
                id="ps-theme"
                value={draft.theme}
                onChange={(event) =>
                  setDraft({ ...draft, theme: event.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ps-deadline">Deadline for Idea Submission</Label>
              <Input
                id="ps-deadline"
                placeholder="20-Sep-26"
                value={draft.deadline}
                onChange={(event) =>
                  setDraft({ ...draft, deadline: event.target.value })
                }
              />
            </div>
          </div>

          {draftError && <p className="text-sm text-error">{draftError}</p>}

          <Button
            type="button"
            variant="secondary"
            onClick={addManualStatement}
          >
            <Plus className="h-4 w-4" />
            Add Problem Statement
          </Button>
        </div>

        <div className="rounded-[var(--radius-md)] border border-border p-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-text">Excel bulk upload</h4>
            <p className="mt-1 text-xs text-text-muted">
              Upload a sheet with SIH columns. Duplicates (same PS Number or
              title) are skipped automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4" />
              Download template
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Upload Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleExcelUpload(file);
              }}
            />
          </div>

          {uploadSummary && (
            <p className="text-sm text-success">{uploadSummary}</p>
          )}
          {uploadError && <p className="text-sm text-error">{uploadError}</p>}
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
              value={config.formEyebrow}
              onChange={(event) =>
                setConfig({ ...config, formEyebrow: event.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="formTitle">Form Title</Label>
            <Input
              id="formTitle"
              value={config.formTitle}
              onChange={(event) =>
                setConfig({ ...config, formTitle: event.target.value })
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="formDescription">Form Description</Label>
            <Textarea
              id="formDescription"
              value={config.formDescription}
              onChange={(event) =>
                setConfig({ ...config, formDescription: event.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="submitButtonText">Submit Button Text</Label>
            <Input
              id="submitButtonText"
              value={config.submitButtonText}
              onChange={(event) =>
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
              value={config.closedTitle}
              onChange={(event) =>
                setConfig({ ...config, closedTitle: event.target.value })
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="closedMessage">Closed State Message</Label>
            <Textarea
              id="closedMessage"
              value={config.closedMessage}
              onChange={(event) =>
                setConfig({ ...config, closedMessage: event.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="successTitle">Success State Title</Label>
            <Input
              id="successTitle"
              value={config.successTitle}
              onChange={(event) =>
                setConfig({ ...config, successTitle: event.target.value })
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="successMessage">Success State Message</Label>
            <Textarea
              id="successMessage"
              value={config.successMessage}
              onChange={(event) =>
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
  ) : null;

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
      <p className="text-error text-sm">
        {loadError ?? "Settings unavailable"}
      </p>
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
