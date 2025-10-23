// src/models/VerificationRequest.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IVerificationRequest extends Document {
  userId: Types.ObjectId;
  type: 'id' | 'qualification' | string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRequestSchema = new Schema<IVerificationRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comments: { type: String },
}, { timestamps: true });

export default model<IVerificationRequest>('VerificationRequest', VerificationRequestSchema);
