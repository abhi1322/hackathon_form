import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  normalizeProblemStatements,
  type ProblemStatement,
} from "@/lib/problem-statements";
import {
  DEFAULT_FORM_COPY,
  DEFAULT_ALLOWED_EMAIL_DOMAINS,
  type PublicConfig,
} from "@/lib/public-config";

export { DEFAULT_FORM_COPY, type PublicConfig };
export type { ProblemStatement };

const configSchema = new Schema(
  {
    minTeamSize: { type: Number, required: true, default: 2, min: 1 },
    maxTeamSize: { type: Number, required: true, default: 4, min: 1 },
    minFemaleMembers: { type: Number, required: true, default: 1, min: 0 },
    allowedEmailDomain: {
      type: String,
      required: true,
      default: "shoolini.edu.in",
      trim: true,
    },
    allowedEmailDomains: {
      type: [String],
      required: true,
      default: [...DEFAULT_ALLOWED_EMAIL_DOMAINS],
    },
    registrationOpen: { type: Boolean, required: true, default: true },
    formEyebrow: {
      type: String,
      required: true,
      default: DEFAULT_FORM_COPY.formEyebrow,
      trim: true,
    },
    formTitle: {
      type: String,
      required: true,
      default: DEFAULT_FORM_COPY.formTitle,
      trim: true,
    },
    formDescription: {
      type: String,
      required: true,
      default: DEFAULT_FORM_COPY.formDescription,
      trim: true,
    },
    closedTitle: {
      type: String,
      required: true,
      default: DEFAULT_FORM_COPY.closedTitle,
      trim: true,
    },
    closedMessage: {
      type: String,
      required: true,
      default: DEFAULT_FORM_COPY.closedMessage,
      trim: true,
    },
    successTitle: {
      type: String,
      required: true,
      default: DEFAULT_FORM_COPY.successTitle,
      trim: true,
    },
    successMessage: {
      type: String,
      required: true,
      default: DEFAULT_FORM_COPY.successMessage,
      trim: true,
    },
    submitButtonText: {
      type: String,
      required: true,
      default: DEFAULT_FORM_COPY.submitButtonText,
      trim: true,
    },
    problemStatements: {
      type: [Schema.Types.Mixed],
      required: true,
      default: [],
    },
  },
  { timestamps: true },
);

export type IConfig = InferSchemaType<typeof configSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ConfigDocument = IConfig & mongoose.Document;

export const Config: Model<ConfigDocument> =
  mongoose.models.Config ??
  mongoose.model<ConfigDocument>("Config", configSchema);

export function resolveAllowedEmailDomains(config: IConfig): string[] {
  const existing = config.allowedEmailDomains;
  if (Array.isArray(existing) && existing.length > 0) {
    return [...new Set(existing.map((domain) => domain.trim()).filter(Boolean))];
  }

  const legacy = config.allowedEmailDomain?.trim() || DEFAULT_ALLOWED_EMAIL_DOMAINS[0];
  return [...new Set([legacy, ...DEFAULT_ALLOWED_EMAIL_DOMAINS])];
}

export function toPublicConfig(config: IConfig): PublicConfig {
  return {
    minTeamSize: config.minTeamSize,
    maxTeamSize: config.maxTeamSize,
    minFemaleMembers: config.minFemaleMembers,
    allowedEmailDomains: resolveAllowedEmailDomains(config),
    registrationOpen: config.registrationOpen,
    formEyebrow: config.formEyebrow ?? DEFAULT_FORM_COPY.formEyebrow,
    formTitle: config.formTitle ?? DEFAULT_FORM_COPY.formTitle,
    formDescription: config.formDescription ?? DEFAULT_FORM_COPY.formDescription,
    closedTitle: config.closedTitle ?? DEFAULT_FORM_COPY.closedTitle,
    closedMessage: config.closedMessage ?? DEFAULT_FORM_COPY.closedMessage,
    successTitle: config.successTitle ?? DEFAULT_FORM_COPY.successTitle,
    successMessage: config.successMessage ?? DEFAULT_FORM_COPY.successMessage,
    submitButtonText:
      config.submitButtonText ?? DEFAULT_FORM_COPY.submitButtonText,
    problemStatements: normalizeProblemStatements(config.problemStatements),
  };
}

export async function getOrCreateConfig(): Promise<ConfigDocument> {
  let config = await Config.findOne();
  if (!config) {
    config = await Config.create({});
    return config;
  }

  let changed = false;
  for (const [key, value] of Object.entries(DEFAULT_FORM_COPY)) {
    if (config.get(key) === undefined) {
      config.set(key, value);
      changed = true;
    }
  }

  const problemStatements = config.get("problemStatements");
  if (problemStatements === undefined || !Array.isArray(problemStatements)) {
    config.set("problemStatements", []);
    config.markModified("problemStatements");
    changed = true;
  } else {
    const normalized = normalizeProblemStatements(problemStatements);
    const needsNormalize =
      normalized.length !== problemStatements.length ||
      problemStatements.some((item) => typeof item === "string");
    if (needsNormalize) {
      config.set("problemStatements", normalized);
      config.markModified("problemStatements");
      changed = true;
    }
  }

  const allowedEmailDomains = resolveAllowedEmailDomains(config);
  const currentDomains = config.get("allowedEmailDomains");
  if (
    !Array.isArray(currentDomains) ||
    currentDomains.length === 0 ||
    JSON.stringify(currentDomains) !== JSON.stringify(allowedEmailDomains)
  ) {
    config.set("allowedEmailDomains", allowedEmailDomains);
    config.markModified("allowedEmailDomains");
    changed = true;
  }

  const primaryDomain = allowedEmailDomains[0] ?? DEFAULT_ALLOWED_EMAIL_DOMAINS[0];
  if (config.allowedEmailDomain !== primaryDomain) {
    config.set("allowedEmailDomain", primaryDomain);
    changed = true;
  }

  if (changed) {
    await config.save();
  }

  return config;
}
