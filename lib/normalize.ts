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
  return buildEmailDomainsRegex([domain]);
}

export function buildEmailDomainsRegex(domains: string[]): RegExp {
  const normalized = [...new Set(domains.map((domain) => domain.trim()).filter(Boolean))];
  if (normalized.length === 0) {
    return /^$/;
  }
  const alternation = normalized.map((domain) => escapeRegex(domain)).join("|");
  return new RegExp(`^[^\\s@]+@(?:${alternation})$`, "i");
}

export function formatAllowedEmailDomains(domains: string[]): string {
  const normalized = [...new Set(domains.map((domain) => domain.trim()).filter(Boolean))];
  if (normalized.length === 0) {
    return "";
  }
  if (normalized.length === 1) {
    return `@${normalized[0]}`;
  }
  const last = normalized[normalized.length - 1];
  const rest = normalized.slice(0, -1).map((domain) => `@${domain}`);
  return `${rest.join(", ")} or @${last}`;
}
