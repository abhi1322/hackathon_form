"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { Trash2 } from "lucide-react";
import {
  Button,
  FieldError,
  FieldHint,
  Input,
  Label,
  Select,
} from "@/components/ui/form";
import {
  buildEmailDomainsRegex,
  formatAllowedEmailDomains,
} from "@/lib/normalize";
import type { PublicConfig } from "@/lib/public-config";
import type { RegistrationInput } from "@/lib/schemas/registration";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetError,
  UseFormClearErrors,
} from "react-hook-form";

interface MemberRowProps {
  index: number;
  isLeader: boolean;
  canRemove: boolean;
  config: PublicConfig;
  register: UseFormRegister<RegistrationInput>;
  errors: FieldErrors<RegistrationInput>;
  onRemove: () => void;
  setError: UseFormSetError<RegistrationInput>;
  clearErrors: UseFormClearErrors<RegistrationInput>;
}

export function MemberRow({
  index,
  isLeader,
  canRemove,
  config,
  register,
  errors,
  onRemove,
  setError,
  clearErrors,
}: MemberRowProps) {
  const memberErrors = errors.members?.[index];

  const emailDomainMessage = `Email must use ${formatAllowedEmailDomains(config.allowedEmailDomains)}`;
  const emailPlaceholder = config.allowedEmailDomains
    .map((domain) => `name@${domain}`)
    .join(" or ");

  const validateEmailDomain = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const regex = buildEmailDomainsRegex(config.allowedEmailDomains);
    if (!regex.test(trimmed)) {
      setError(`members.${index}.email`, {
        type: "manual",
        message: emailDomainMessage,
      });
    } else {
      clearErrors(`members.${index}.email`);
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        layout="position"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-6 sm:px-6"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-text">
              {isLeader ? "Team Leader" : `Member ${index + 1}`}
            </h3>
            {isLeader && (
              <p className="mt-1 text-sm text-text-muted">
                Registered as the first team member.
              </p>
            )}
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              onClick={onRemove}
              aria-label={`Remove member ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor={`members.${index}.name`}>Full Name</Label>
            <FieldHint>As shown on your university ID.</FieldHint>
            <Input
              id={`members.${index}.name`}
              placeholder="Enter full name"
              className="mt-2"
              {...register(`members.${index}.name`)}
            />
            <FieldError message={memberErrors?.name?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor={`members.${index}.email`}>Email</Label>
            <FieldHint>
              {formatAllowedEmailDomains(config.allowedEmailDomains)} only.
            </FieldHint>
            <Input
              id={`members.${index}.email`}
              type="email"
              placeholder={emailPlaceholder}
              className="mt-2"
              {...register(`members.${index}.email`, {
                onBlur: (event) => validateEmailDomain(event.target.value),
              })}
            />
            <FieldError message={memberErrors?.email?.message} />
          </div>

          <div>
            <Label htmlFor={`members.${index}.registrationId`}>
              Registration ID / Roll Number
            </Label>
            <FieldHint>GF, PGD, or INGF + 9 digits.</FieldHint>
            <Input
              id={`members.${index}.registrationId`}
              placeholder="GF202346252, PGD202344271, or INGF202346252"
              maxLength={13}
              autoCapitalize="characters"
              spellCheck={false}
              className="mt-2 uppercase tracking-wide"
              {...register(`members.${index}.registrationId`, {
                setValueAs: (value: string) =>
                  value.trim().replace(/\s+/g, "").toUpperCase(),
                onChange: (event) => {
                  const input = event.target as HTMLInputElement;
                  const cleaned = input.value
                    .replace(/\s+/g, "")
                    .toUpperCase()
                    .slice(0, 13);
                  if (input.value !== cleaned) {
                    input.value = cleaned;
                  }
                },
              })}
            />
            <FieldError message={memberErrors?.registrationId?.message} />
          </div>

          <div>
            <Label htmlFor={`members.${index}.phone`}>Phone Number</Label>
            <FieldHint>10–15 digit mobile number.</FieldHint>
            <Input
              id={`members.${index}.phone`}
              type="tel"
              placeholder="10-digit mobile number"
              className="mt-2"
              {...register(`members.${index}.phone`)}
            />
            <FieldError message={memberErrors?.phone?.message} />
          </div>

          <div>
            <Label htmlFor={`members.${index}.gender`}>Gender</Label>
            <FieldHint>
              Min {config.minFemaleMembers} female member
              {config.minFemaleMembers === 1 ? "" : "s"} per team.
            </FieldHint>
            <Select
              id={`members.${index}.gender`}
              className="mt-2"
              {...register(`members.${index}.gender`)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
            <FieldError message={memberErrors?.gender?.message} />
          </div>
        </div>
      </m.div>
    </LazyMotion>
  );
}
