import { z } from "zod";
import {
  buildEmailDomainsRegex,
  formatAllowedEmailDomains,
} from "@/lib/normalize";
import {
  isValidProblemStatement,
  normalizeProblemStatements,
  type ProblemStatement,
} from "@/lib/problem-statements";

export const genderEnum = z.enum(["Male", "Female", "Other"]);

export type RegistrationConfig = {
  minTeamSize: number;
  maxTeamSize: number;
  minFemaleMembers: number;
  allowedEmailDomains: string[];
  problemStatements: ProblemStatement[];
};

type RegistrationSchemaOptions = {
  legacyProblemStatement?: string;
};

export const problemStatementSchema = z
  .object({
    serialNo: z.string().trim().max(40).optional().default(""),
    organization: z.string().trim().max(300).default(""),
    title: z.string().trim().min(1, "Title is required").max(500),
    category: z.string().trim().max(80).default(""),
    psNumber: z.string().trim().max(80).default(""),
    theme: z.string().trim().max(120).default(""),
    deadline: z.string().trim().max(80).default(""),
  })
  .superRefine((data, ctx) => {
    if (!data.title.trim() && !data.psNumber.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Title or PS Number is required",
        path: ["title"],
      });
    }
  });

export function createMemberSchema(allowedEmailDomains: string[]) {
  const domainRegex = buildEmailDomainsRegex(allowedEmailDomains);
  const domainMessage = `Email must use ${formatAllowedEmailDomains(allowedEmailDomains)}`;

  return z.object({
    name: z.string().trim().min(2, "Full name is required"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .regex(
        domainRegex,
        domainMessage,
      ),
    registrationId: z
      .string()
      .trim()
      .min(1, "Registration ID is required")
      .transform((val) => val.replace(/\s+/g, "").toUpperCase())
      .refine(
        (val) =>
          /^[A-Z]{2}[0-9]{9}$/.test(val) ||
          /^PGD[0-9]{9}$/.test(val) ||
          /^INGF[0-9]{9}$/.test(val),
        {
          message:
            "Use GF202346252 (2 letters + 9 digits), PGD202344271 (PGD + 9 digits), or INGF202346252 (INGF + 9 digits)",
        },
      ),
    phone: z
      .string()
      .trim()
      .min(10, "Enter a valid phone number")
      .max(15, "Enter a valid phone number"),
    gender: genderEnum,
  });
}

export function createRegistrationSchema(
  config: RegistrationConfig,
  options: RegistrationSchemaOptions = {},
) {
  const memberSchema = createMemberSchema(config.allowedEmailDomains);
  const problemStatements = normalizeProblemStatements(config.problemStatements);

  return z
    .object({
      teamName: z
        .string()
        .trim()
        .min(2, "Team name must be at least 2 characters")
        .max(80, "Team name is too long"),
      problemStatement: z.string().trim(),
      members: z.array(memberSchema),
    })
    .superRefine((data, ctx) => {
      if (problemStatements.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Problem statements are not configured yet",
          path: ["problemStatement"],
        });
        return;
      }

      if (
        !isValidProblemStatement(
          data.problemStatement,
          problemStatements,
          options.legacyProblemStatement,
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a valid problem statement",
          path: ["problemStatement"],
        });
      }

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
    allowedEmailDomains: z.array(z.string().trim().min(3)).min(1).optional(),
    registrationOpen: z.boolean().optional(),
    formEyebrow: z.string().trim().min(1).max(120).optional(),
    formTitle: z.string().trim().min(1).max(120).optional(),
    formDescription: z.string().trim().min(1).max(500).optional(),
    closedTitle: z.string().trim().min(1).max(120).optional(),
    closedMessage: z.string().trim().min(1).max(500).optional(),
    successTitle: z.string().trim().min(1).max(120).optional(),
    successMessage: z.string().trim().min(1).max(500).optional(),
    submitButtonText: z.string().trim().min(1).max(80).optional(),
    problemStatements: z.array(problemStatementSchema).max(500).optional(),
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

export function toRegistrationConfig(
  config: RegistrationConfig,
): RegistrationConfig {
  return {
    ...config,
    problemStatements: normalizeProblemStatements(config.problemStatements),
  };
}
