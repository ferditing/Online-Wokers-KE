// models/WebhookLog.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IWebhookLog extends Document {
  receivedAt: Date;
  source: string;
  event?: string;
  lookupKeys?: any;
  payload: any;
}

const WebhookLogSchema = new Schema<IWebhookLog>({
  receivedAt: { type: Date, default: Date.now },
  source: { type: String, required: true },
  event: { type: String },
  lookupKeys: { type: Schema.Types.Mixed },
  payload: { type: Schema.Types.Mixed, required: true }
});

export default mongoose.model<IWebhookLog>("WebhookLog", WebhookLogSchema);
