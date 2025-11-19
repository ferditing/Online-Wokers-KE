// backend/src/models/Job.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  description?: string;
  requiredSkills?: string[];
  budget?: number;
  currency?: string;
  status?: string;
  employer: mongoose.Types.ObjectId;
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  description: { type: String },
  requiredSkills: [{ type: String }],
  budget: { type: Number },
  currency: { type: String, default: "KES" },
  status: { type: String, enum: ["open", "in_progress", "completed", "cancelled"], default: "open" },
  employer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IJob>("Job", JobSchema);
