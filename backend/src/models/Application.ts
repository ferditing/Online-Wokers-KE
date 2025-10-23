// src/models/Application.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface ISubmission {
  files?: string[];
  notes?: string;
  submittedAt?: Date;
}

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  worker: Types.ObjectId;
  coverMessage: string;
  proposedPrice?: number;
  status: 'applied' | 'accepted' | 'rejected' | 'withdrawn';
  submission?: ISubmission;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  files: [{ type: String }],
  notes: { type: String },
  submittedAt: { type: Date },
}, { _id: false });

const ApplicationSchema = new Schema<IApplication>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coverMessage: { type: String, required: true },
  proposedPrice: { type: Number },
  status: { type: String, enum: ['applied', 'accepted', 'rejected', 'withdrawn'], default: 'applied' },
  submission: { type: SubmissionSchema, default: null },
}, { timestamps: true });

export default model<IApplication>('Application', ApplicationSchema);
