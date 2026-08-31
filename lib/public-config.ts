import type { ProblemStatement } from "@/lib/problem-statements";

export const DEFAULT_FORM_COPY = {
  formEyebrow: "Hackathon 2026",
  formTitle: "Team Registration",
  formDescription:
    "Register your team for the hackathon. Add members dynamically and ensure all requirements are met before submitting.",
  closedTitle: "Registration Closed",
  closedMessage:
    "Team registration is not open at this time. Please check back later.",
  successTitle: "Registration Successful",
  successMessage: "Team {teamName} has been registered successfully.",
  submitButtonText: "Submit Registration",
} as const;

export const DEFAULT_ALLOWED_EMAIL_DOMAINS = [
  "shoolini.edu.in",
  "gmail.com",
] as const;

export type PublicConfig = {
  minTeamSize: number;
  maxTeamSize: number;
  minFemaleMembers: number;
  allowedEmailDomains: string[];
  registrationOpen: boolean;
  formEyebrow: string;
  formTitle: string;
  formDescription: string;
  closedTitle: string;
  closedMessage: string;
  successTitle: string;
  successMessage: string;
  submitButtonText: string;
  problemStatements: ProblemStatement[];
};

export function interpolateSuccessMessage(
  template: string,
  teamName: string,
): string {
  return template.replaceAll("{teamName}", teamName);
}
