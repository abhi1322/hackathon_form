"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { MemberRow } from "@/components/MemberRow";
import { Button, FieldError, Input, Label } from "@/components/ui/form";
import type { PublicConfig } from "@/lib/models/Config";
import {
  createRegistrationSchema,
  type RegistrationInput,
} from "@/lib/schemas/registration";

export interface TeamRecord {
  id: string;
  name: string;
  memberCount: number;
  femaleCount: number;
  createdAt: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    registrationId: string;
    phone: string;
    gender: "Male" | "Female" | "Other";
  }>;
}

interface EditTeamModalProps {
  team: TeamRecord;
  config: PublicConfig;
  onClose: () => void;
  onSaved: () => void;
}

export function EditTeamModal({
  team,
  config,
  onClose,
  onSaved,
}: EditTeamModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const schema = useMemo(
    () => createRegistrationSchema(config),
    [config],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    setError: setFieldError,
    clearErrors,
  } = useForm<RegistrationInput>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      teamName: team.name,
      members: team.members.map((member) => ({
        name: member.name,
        email: member.email,
        registrationId: member.registrationId,
        phone: member.phone,
        gender: member.gender,
      })),
    },
  });

  const { fields, remove } = useFieldArray({ control, name: "members" });
  const watchedMembers = useWatch({ control, name: "members" }) ?? [];
  const memberCount = watchedMembers.length;
  const femaleCount = watchedMembers.filter(
    (member) => member?.gender === "Female",
  ).length;

  const canRemoveMember = memberCount > config.minTeamSize;
  const constraintsMet =
    memberCount >= config.minTeamSize &&
    memberCount <= config.maxTeamSize &&
    femaleCount >= config.minFemaleMembers;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to update team");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Failed to update team");
    } finally {
      setSaving(false);
    }
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="w-full max-w-3xl rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-2)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-medium text-text">
              Edit Team
            </h2>
            <p className="text-sm text-text-muted">{team.name}</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div>
            <Label htmlFor="edit-teamName">Team Name</Label>
            <Input id="edit-teamName" {...register("teamName")} />
            <FieldError message={errors.teamName?.message} />
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {fields.map((field, index) => (
                <MemberRow
                  key={field.id}
                  index={index}
                  isLeader={index === 0}
                  canRemove={canRemoveMember}
                  config={config}
                  register={register}
                  errors={errors}
                  onRemove={() => remove(index)}
                  setError={setFieldError}
                  clearErrors={clearErrors}
                />
              ))}
            </AnimatePresence>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || !constraintsMet || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
