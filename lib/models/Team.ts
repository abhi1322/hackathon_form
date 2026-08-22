import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const teamSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true, unique: true },
    memberCount: { type: Number, required: true, min: 0 },
    femaleCount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type ITeam = InferSchemaType<typeof teamSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export type TeamDocument = ITeam & mongoose.Document;

export const Team: Model<TeamDocument> =
  mongoose.models.Team ?? mongoose.model<TeamDocument>("Team", teamSchema);
