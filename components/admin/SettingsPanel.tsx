"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  SectionDivider,
  Textarea,
} from "@/components/ui/form";
import type { PublicConfig } from "@/lib/models/Config";

interface SettingsPanelProps {
  onUpdated: () => void;
}

export function SettingsPanel({ onUpdated }: SettingsPanelProps) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/admin/config");
        if (!response.ok) throw new Error("Failed to load config");
        setConfig(await response.json());
      } catch {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!config) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to save settings");
        return;
      }

      setConfig(data);
      setMessage("Settings saved successfully");
      onUpdated();
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading settings...
        </div>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <p className="text-error text-sm">{error ?? "Settings unavailable"}</p>
      </Card>
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

      <form onSubmit={handleSubmit} className="space-y-8">
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

        <SectionDivider />

        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-text mb-1">
              Form Content
            </h3>
            <p className="text-sm text-text-muted">
              Edit the text shown on the public registration page.
            </p>
          </div>

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
        </div>

        {message && <p className="text-sm text-success">{message}</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </form>
    </Card>
  );
}
