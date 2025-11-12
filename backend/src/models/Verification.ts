// backend/src/models/Verification.ts
import { Schema, model, Document } from 'mongoose';

export interface IVerification extends Document {
  userId: Schema.Types.ObjectId | any; // stored as ObjectId; populated as user object when needed
  type: 'id' | 'qualification' | string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationSchema = new Schema<IVerification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  comments: { type: String },
}, { timestamps: true });

export default model<IVerification>('Verification', VerificationSchema);
