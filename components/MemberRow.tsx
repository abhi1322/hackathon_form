"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { Trash2 } from "lucide-react";
import {
  Button,
  FieldError,
  Input,
  Label,
  Select,
} from "@/components/ui/form";
import { buildEmailDomainRegex } from "@/lib/normalize";
import type { PublicConfig } from "@/lib/models/Config";
import type { MemberInput } from "@/lib/schemas/registration";
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
  register: UseFormRegister<{ teamName: string; members: MemberInput[] }>;
  errors: FieldErrors<{ teamName: string; members: MemberInput[] }>;
  onRemove: () => void;
  setError: UseFormSetError<{ teamName: string; members: MemberInput[] }>;
  clearErrors: UseFormClearErrors<{ teamName: string; members: MemberInput[] }>;
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

  const validateEmailDomain = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const regex = buildEmailDomainRegex(config.allowedEmailDomain);
    if (!regex.test(trimmed)) {
      setError(`members.${index}.email`, {
        type: "manual",
        message: `Email must use @${config.allowedEmailDomain}`,
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
            <Input
              id={`members.${index}.name`}
              placeholder="Enter full name"
              {...register(`members.${index}.name`)}
            />
            <FieldError message={memberErrors?.name?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor={`members.${index}.email`}>University Email</Label>
            <Input
              id={`members.${index}.email`}
              type="email"
              placeholder={`name@${config.allowedEmailDomain}`}
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
            <Input
              id={`members.${index}.registrationId`}
              placeholder="University ID"
              {...register(`members.${index}.registrationId`)}
            />
            <FieldError message={memberErrors?.registrationId?.message} />
          </div>

          <div>
            <Label htmlFor={`members.${index}.phone`}>Phone Number</Label>
            <Input
              id={`members.${index}.phone`}
              type="tel"
              placeholder="10-digit mobile number"
              {...register(`members.${index}.phone`)}
            />
            <FieldError message={memberErrors?.phone?.message} />
          </div>

          <div>
            <Label htmlFor={`members.${index}.gender`}>Gender</Label>
            <Select
              id={`members.${index}.gender`}
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
