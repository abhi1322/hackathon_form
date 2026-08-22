export type ProblemStatement = {
  serialNo?: string;
  organization: string;
  title: string;
  category: string;
  psNumber: string;
  theme: string;
  deadline: string;
};

export const PROBLEM_STATEMENT_EXCEL_HEADERS = [
  "S.No.",
  "Organization",
  "Problem Statement Title",
  "Category",
  "PS Number",
  "Theme",
  "Deadline for Idea Submission",
] as const;

const HEADER_ALIASES: Record<keyof Omit<ProblemStatement, never>, string[]> = {
  serialNo: [
    "s.no.",
    "s.no",
    "sno",
    "serial no",
    "serial number",
    "sr.no.",
    "sr no",
  ],
  organization: ["organization", "organisation", "org"],
  title: [
    "problem statement title",
    "problem statement",
    "title",
    "ps title",
  ],
  category: ["category"],
  psNumber: [
    "ps number",
    "ps no",
    "ps no.",
    "psnumber",
    "problem statement number",
  ],
  theme: ["theme"],
  deadline: [
    "deadline for idea submission",
    "deadline",
    "submission deadline",
  ],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  }
  return String(value).trim();
}

export function getProblemStatementId(statement: ProblemStatement): string {
  const psNumber = statement.psNumber.trim();
  if (psNumber) return psNumber;
  return statement.title.trim();
}

export function formatProblemStatementLabel(
  statement: ProblemStatement,
): string {
  const id = statement.psNumber.trim();
  const title = statement.title.trim();
  if (id && title) return `${id} — ${title}`;
  return title || id;
}

export function normalizeProblemStatement(
  input: unknown,
): ProblemStatement | null {
  if (typeof input === "string") {
    const title = input.trim();
    if (!title) return null;
    return {
      serialNo: "",
      organization: "",
      title,
      category: "",
      psNumber: "",
      theme: "",
      deadline: "",
    };
  }

  if (!input || typeof input !== "object") return null;

  const record = input as Record<string, unknown>;
  const title = cellToString(record.title ?? record.problemStatementTitle);
  const psNumber = cellToString(record.psNumber ?? record.ps_number);

  if (!title && !psNumber) return null;

  return {
    serialNo: cellToString(record.serialNo ?? record.serial_no),
    organization: cellToString(record.organization),
    title: title || psNumber,
    category: cellToString(record.category),
    psNumber,
    theme: cellToString(record.theme),
    deadline: cellToString(record.deadline),
  };
}

export function normalizeProblemStatements(
  input: unknown,
): ProblemStatement[] {
  if (!Array.isArray(input)) return [];

  const normalized: ProblemStatement[] = [];
  for (const item of input) {
    const statement = normalizeProblemStatement(item);
    if (statement) normalized.push(statement);
  }

  return mergeProblemStatements([], normalized);
}

function dedupeKey(statement: ProblemStatement): string {
  const psNumber = statement.psNumber.trim().toLowerCase();
  if (psNumber) return `ps:${psNumber}`;
  return `title:${statement.title.trim().toLowerCase()}`;
}

export function mergeProblemStatements(
  existing: ProblemStatement[],
  incoming: ProblemStatement[],
): ProblemStatement[] {
  const merged: ProblemStatement[] = [];
  const seen = new Set<string>();

  for (const statement of [...existing, ...incoming]) {
    const normalized = normalizeProblemStatement(statement);
    if (!normalized) continue;
    const key = dedupeKey(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(normalized);
  }

  return merged;
}

export function getAllowedProblemStatementIds(
  statements: ProblemStatement[],
): string[] {
  return statements.map(getProblemStatementId).filter(Boolean);
}

export function findProblemStatement(
  statements: ProblemStatement[],
  value: string,
): ProblemStatement | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return statements.find((statement) => {
    const id = getProblemStatementId(statement);
    if (id === trimmed) return true;
    if (statement.psNumber.trim() === trimmed) return true;
    if (statement.title.trim() === trimmed) return true;
    return false;
  });
}

export function isValidProblemStatement(
  value: string,
  allowedStatements: ProblemStatement[],
  legacyValue?: string,
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (findProblemStatement(allowedStatements, trimmed)) return true;
  return legacyValue !== undefined && trimmed === legacyValue.trim();
}

export function resolveProblemStatementDisplay(
  value: string,
  statements: ProblemStatement[],
): string {
  const match = findProblemStatement(statements, value);
  if (match) return formatProblemStatementLabel(match);
  return value.trim() || "—";
}

function mapHeaders(row: Record<string, unknown>): Partial<
  Record<keyof ProblemStatement, string>
> {
  const mapping: Partial<Record<keyof ProblemStatement, string>> = {};
  const keys = Object.keys(row);

  for (const key of keys) {
    const normalized = normalizeHeader(key);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
      [keyof ProblemStatement, string[]]
    >) {
      if (aliases.includes(normalized) && mapping[field] === undefined) {
        mapping[field] = key;
      }
    }
  }

  return mapping;
}

export function parseProblemStatementsFromRows(
  rows: Record<string, unknown>[],
): { statements: ProblemStatement[]; skippedEmpty: number } {
  if (rows.length === 0) {
    return { statements: [], skippedEmpty: 0 };
  }

  const mapping = mapHeaders(rows[0] ?? {});
  let skippedEmpty = 0;
  const parsed: ProblemStatement[] = [];

  for (const row of rows) {
    const title = cellToString(
      mapping.title ? row[mapping.title] : undefined,
    );
    const psNumber = cellToString(
      mapping.psNumber ? row[mapping.psNumber] : undefined,
    );

    if (!title && !psNumber) {
      skippedEmpty += 1;
      continue;
    }

    parsed.push({
      serialNo: cellToString(
        mapping.serialNo ? row[mapping.serialNo] : undefined,
      ),
      organization: cellToString(
        mapping.organization ? row[mapping.organization] : undefined,
      ),
      title: title || psNumber,
      category: cellToString(
        mapping.category ? row[mapping.category] : undefined,
      ),
      psNumber,
      theme: cellToString(mapping.theme ? row[mapping.theme] : undefined),
      deadline: cellToString(
        mapping.deadline ? row[mapping.deadline] : undefined,
      ),
    });
  }

  return {
    statements: mergeProblemStatements([], parsed),
    skippedEmpty,
  };
}

export function countMergeStats(
  existing: ProblemStatement[],
  incoming: ProblemStatement[],
): { added: number; duplicates: number } {
  const seen = new Set(existing.map(dedupeKey));
  let added = 0;
  let duplicates = 0;

  for (const statement of incoming) {
    const normalized = normalizeProblemStatement(statement);
    if (!normalized) continue;
    const key = dedupeKey(normalized);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    added += 1;
  }

  return { added, duplicates };
}
