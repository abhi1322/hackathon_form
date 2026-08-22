import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

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
};

export function toPublicConfig(config: IConfig): PublicConfig {
  return {
    minTeamSize: config.minTeamSize,
    maxTeamSize: config.maxTeamSize,
    minFemaleMembers: config.minFemaleMembers,
    allowedEmailDomain: config.allowedEmailDomain,
    registrationOpen: config.registrationOpen,
  };
}

export async function getOrCreateConfig(): Promise<ConfigDocument> {
  let config = await Config.findOne();
  if (!config) {
    config = await Config.create({});
  }
  return config;
}
