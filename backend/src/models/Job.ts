import { Schema, model, Document, Types } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  employer: Types.ObjectId;
  budget: number;
  currency: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  employer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  budget: { type: Number, required: true },
  currency: { type: String, default: 'KES' },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
}, { timestamps: true });

export default model<IJob>('Job', JobSchema);
