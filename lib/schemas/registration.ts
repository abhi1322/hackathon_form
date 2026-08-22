import { z } from "zod";
import { buildEmailDomainRegex } from "@/lib/normalize";

export const genderEnum = z.enum(["Male", "Female", "Other"]);

export type RegistrationConfig = {
  minTeamSize: number;
  maxTeamSize: number;
  minFemaleMembers: number;
  allowedEmailDomain: string;
};

export function createMemberSchema(allowedEmailDomain: string) {
  const domainRegex = buildEmailDomainRegex(allowedEmailDomain);

  return z.object({
    name: z.string().trim().min(2, "Full name is required"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .regex(
        domainRegex,
        `Email must use @${allowedEmailDomain}`,
      ),
    registrationId: z
      .string()
      .trim()
      .min(1, "Registration ID is required"),
    phone: z
      .string()
      .trim()
      .min(10, "Enter a valid phone number")
      .max(15, "Enter a valid phone number"),
    gender: genderEnum,
  });
}

export function createRegistrationSchema(config: RegistrationConfig) {
  const memberSchema = createMemberSchema(config.allowedEmailDomain);

  return z
    .object({
      teamName: z
        .string()
        .trim()
        .min(2, "Team name must be at least 2 characters")
        .max(80, "Team name is too long"),
      members: z.array(memberSchema),
    })
    .superRefine((data, ctx) => {
      if (data.members.length < config.minTeamSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `At least ${config.minTeamSize} members are required`,
          path: ["members"],
        });
      }

      if (data.members.length > config.maxTeamSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Maximum ${config.maxTeamSize} members allowed`,
          path: ["members"],
        });
      }

      const femaleCount = data.members.filter(
        (member) => member.gender === "Female",
      ).length;

      if (femaleCount < config.minFemaleMembers) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `At least ${config.minFemaleMembers} female member(s) required`,
          path: ["members"],
        });
      }

      const emailMap = new Map<string, number[]>();
      const registrationMap = new Map<string, number[]>();

      data.members.forEach((member, index) => {
        const normalizedEmail = member.email.toLowerCase().trim();
        const normalizedRegistrationId = member.registrationId
          .toLowerCase()
          .trim();

        if (!emailMap.has(normalizedEmail)) {
          emailMap.set(normalizedEmail, []);
        }
        emailMap.get(normalizedEmail)!.push(index);

        if (!registrationMap.has(normalizedRegistrationId)) {
          registrationMap.set(normalizedRegistrationId, []);
        }
        registrationMap.get(normalizedRegistrationId)!.push(index);
      });

      for (const [email, indices] of emailMap.entries()) {
        if (indices.length > 1) {
          indices.forEach((index) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Duplicate email in this team (${email})`,
              path: ["members", index, "email"],
            });
          });
        }
      }

      for (const [registrationId, indices] of registrationMap.entries()) {
        if (indices.length > 1) {
          indices.forEach((index) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Duplicate registration ID in this team (${registrationId})`,
              path: ["members", index, "registrationId"],
            });
          });
        }
      }
    });
}

export type RegistrationInput = z.infer<
  ReturnType<typeof createRegistrationSchema>
>;

export type MemberInput = z.infer<ReturnType<typeof createMemberSchema>>;

export const adminConfigUpdateSchema = z
  .object({
    minTeamSize: z.number().int().min(1).optional(),
    maxTeamSize: z.number().int().min(1).optional(),
    minFemaleMembers: z.number().int().min(0).optional(),
    allowedEmailDomain: z.string().trim().min(3).optional(),
    registrationOpen: z.boolean().optional(),
    formEyebrow: z.string().trim().min(1).max(120).optional(),
    formTitle: z.string().trim().min(1).max(120).optional(),
    formDescription: z.string().trim().min(1).max(500).optional(),
    closedTitle: z.string().trim().min(1).max(120).optional(),
    closedMessage: z.string().trim().min(1).max(500).optional(),
    successTitle: z.string().trim().min(1).max(120).optional(),
    successMessage: z.string().trim().min(1).max(500).optional(),
    submitButtonText: z.string().trim().min(1).max(80).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.minTeamSize !== undefined &&
      data.maxTeamSize !== undefined &&
      data.minTeamSize > data.maxTeamSize
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimum team size cannot exceed maximum team size",
        path: ["minTeamSize"],
      });
    }
  });

export type AdminConfigUpdate = z.infer<typeof adminConfigUpdateSchema>;
