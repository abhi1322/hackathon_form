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

export type PublicConfig = {
  minTeamSize: number;
  maxTeamSize: number;
  minFemaleMembers: number;
  allowedEmailDomain: string;
  registrationOpen: boolean;
  formEyebrow: string;
  formTitle: string;
  formDescription: string;
  closedTitle: string;
  closedMessage: string;
  successTitle: string;
  successMessage: string;
  submitButtonText: string;
  problemStatements: string[];
};

export function interpolateSuccessMessage(
  template: string,
  teamName: string,
): string {
  return template.replaceAll("{teamName}", teamName);
}
