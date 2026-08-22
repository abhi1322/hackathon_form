import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

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
};

export function toPublicConfig(config: IConfig): PublicConfig {
  return {
    minTeamSize: config.minTeamSize,
    maxTeamSize: config.maxTeamSize,
    minFemaleMembers: config.minFemaleMembers,
    allowedEmailDomain: config.allowedEmailDomain,
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

  if (changed) {
    await config.save();
  }

  return config;
}

export function interpolateSuccessMessage(
  template: string,
  teamName: string,
): string {
  return template.replaceAll("{teamName}", teamName);
}
