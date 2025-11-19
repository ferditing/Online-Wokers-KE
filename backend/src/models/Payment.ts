// backend/src/models/Payment.ts
import mongoose, { Schema, Document } from "mongoose";

export type PaymentType = "topup" | "escrow" | "payout" | "release";
export type PaymentStatus = "pending" | "paid" | "failed" | "approved" | "rejected" | "released";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;       // actor who initiated (employer for topup, worker for payout)
  jobId?: mongoose.Types.ObjectId | null;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  providerData?: any;                    // raw provider response (mpesa)
  meta?: any;                            // notes, phone number, bank info...
  platformFee?: number;                  // computed platform fee
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: false },
  amount: { type: Number, required: true },
  currency: { type: String, default: "KES" },
  type: { type: String, enum: ["topup","escrow","payout","release","job_verification"], required: true },
  status: { type: String, enum: ["pending","paid","failed","approved","rejected","released"], default: "pending" },
  providerData: { type: Schema.Types.Mixed },
  meta: { type: Schema.Types.Mixed },
  platformFee: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IPayment>("Payment", PaymentSchema);
