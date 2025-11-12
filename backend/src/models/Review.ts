// backend/src/models/Review.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  jobId: Types.ObjectId;
  reviewer: Types.ObjectId; // employer who reviews
  workerId: Types.ObjectId;  // worker being reviewed
  rating: number; // 1..5
  comment?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default model<IReview>('Review', ReviewSchema);
