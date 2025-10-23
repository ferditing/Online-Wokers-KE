// src/models/Escrow.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IEscrow extends Document {
  jobId: Types.ObjectId;
  employerId: Types.ObjectId;
  amount: number;
  currency: string;
  platformFeePercent: number;
  status: 'pending' | 'funded' | 'released' | 'disputed';
  externalTxId?: string;
  createdAt: Date;
}

const EscrowSchema = new Schema<IEscrow>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'KES' },
  platformFeePercent: { type: Number, default: 25 },
  status: { type: String, enum: ['pending', 'funded', 'released', 'disputed'], default: 'pending' },
  externalTxId: { type: String },
}, { timestamps: true });

export default model<IEscrow>('Escrow', EscrowSchema);
