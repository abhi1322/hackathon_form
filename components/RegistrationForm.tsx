"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ConstraintBar } from "@/components/ConstraintBar";
import { MemberRow } from "@/components/MemberRow";
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
} from "@/components/ui/form";
import type { PublicConfig } from "@/lib/models/Config";
import {
  createRegistrationSchema,
  type MemberInput,
  type RegistrationInput,
} from "@/lib/schemas/registration";

const emptyMember = (): MemberInput => ({
  name: "",
  email: "",
  registrationId: "",
  phone: "",
  gender: "Male",
});

export function RegistrationForm() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successTeamName, setSuccessTeamName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/config");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Unable to load registration settings.",
          );
        }
        setConfig(data as PublicConfig);
      } catch (error) {
        console.error(error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Unable to load registration settings.",
        );
      } finally {
        setLoadingConfig(false);
      }
    }

    loadConfig();
  }, []);

  const schema = useMemo(() => {
    if (!config) return null;
    return createRegistrationSchema(config);
  }, [config]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setError,
    clearErrors,
  } = useForm<RegistrationInput>({
    resolver: schema ? zodResolver(schema) : undefined,
    mode: "onChange",
    defaultValues: {
      teamName: "",
      members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  useEffect(() => {
    if (!config) return;

    reset({
      teamName: "",
      members: Array.from({ length: config.minTeamSize }, emptyMember),
    });
  }, [config, reset]);

  const watchedMembers = useWatch({ control, name: "members" }) ?? [];
  const memberCount = watchedMembers.length;
  const femaleCount = watchedMembers.filter(
    (member) => member?.gender === "Female",
  ).length;

  const canAddMember = config ? memberCount < config.maxTeamSize : false;
  const canRemoveMember = config ? memberCount > config.minTeamSize : false;

  const constraintsMet =
    !!config &&
    memberCount >= config.minTeamSize &&
    memberCount <= config.maxTeamSize &&
    femaleCount >= config.minFemaleMembers;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error ?? "Registration failed.");
        return;
      }

      setSuccessTeamName(data.teamName ?? values.teamName);
    } catch (error) {
      console.error(error);
      setSubmitError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  });

  if (loadingConfig) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card className="text-center">
        <h2 className="font-display text-xl font-medium text-text mb-2">
          Unable to Load Registration
        </h2>
        <p className="text-text-muted">
          {submitError ??
            "Registration settings could not be loaded. Check your database connection and restart the dev server."}
        </p>
      </Card>
    );
  }

  if (!config.registrationOpen) {
    return (
      <Card className="text-center py-10">
        <h2 className="font-display text-2xl font-medium text-text mb-2">
          Registration Closed
        </h2>
        <p className="text-text-muted">
          Team registration is not open at this time. Please check back later.
        </p>
      </Card>
    );
  }

  if (successTeamName) {
    return (
      <Card className="text-center py-10">
        <h2 className="font-display text-2xl font-medium text-text mb-2">
          Registration Successful
        </h2>
        <p className="text-text-muted">
          Team <strong className="text-text">{successTeamName}</strong> has been
          registered successfully.
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-28">
      <Card>
        <Label htmlFor="teamName">Team Name</Label>
        <Input
          id="teamName"
          placeholder="Enter a unique team name"
          {...register("teamName")}
        />
        <FieldError message={errors.teamName?.message} />
      </Card>

      <div className="space-y-4">
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
              setError={setError}
              clearErrors={clearErrors}
            />
          ))}
        </AnimatePresence>
      </div>

      {canAddMember && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => append(emptyMember())}
        >
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      )}

      {submitError && (
        <div className="rounded-[var(--radius-md)] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {submitError}
        </div>
      )}

      <ConstraintBar
        memberCount={memberCount}
        minTeamSize={config.minTeamSize}
        maxTeamSize={config.maxTeamSize}
        femaleCount={femaleCount}
        minFemaleMembers={config.minFemaleMembers}
        isFormValid={isValid}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={!isValid || !constraintsMet || submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Registration"
        )}
      </Button>
    </form>
  );
}
