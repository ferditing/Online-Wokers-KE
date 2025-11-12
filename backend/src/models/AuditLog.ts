// backend/src/models/AuditLog.ts
import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor: Schema.Types.ObjectId | string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: String,
  targetId: String,
  details: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default model<IAuditLog>('AuditLog', AuditLogSchema);
