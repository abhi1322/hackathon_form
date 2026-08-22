export function parseBulkProblemStatements(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mergeProblemStatements(
  existing: string[],
  incoming: string[],
): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const statement of [...existing, ...incoming]) {
    const trimmed = statement.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    merged.push(trimmed);
  }

  return merged;
}

export function isValidProblemStatement(
  value: string,
  allowedStatements: string[],
  legacyValue?: string,
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (allowedStatements.includes(trimmed)) return true;
  return legacyValue !== undefined && trimmed === legacyValue.trim();
}
