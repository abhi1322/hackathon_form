export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizeRegistrationId(registrationId: string): string {
  return registrationId.toLowerCase().trim();
}

export function normalizeTeamName(name: string): string {
  return name.toLowerCase().trim();
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildEmailDomainRegex(domain: string): RegExp {
  const escaped = escapeRegex(domain);
  return new RegExp(`^[^\\s@]+@${escaped}$`, "i");
}
