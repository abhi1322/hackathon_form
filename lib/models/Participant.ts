import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const participantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    registrationId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    phone: { type: String, required: true, trim: true },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type IParticipant = InferSchemaType<typeof participantSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export type ParticipantDocument = IParticipant & mongoose.Document;

export const Participant: Model<ParticipantDocument> =
  mongoose.models.Participant ??
  mongoose.model<ParticipantDocument>("Participant", participantSchema);
