import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId; // recipient user
  type: 'application_accepted' | 'application_rejected' | 'submission_approved' | 'new_application' | 'submission_received';
  message: string;
  read: boolean;
  relatedId?: Types.ObjectId; // related job or application ID
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['application_accepted', 'application_rejected', 'submission_approved', 'new_application', 'submission_received'],
    required: true
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedId: { type: Schema.Types.ObjectId }, // can reference Job or Application
}, { timestamps: true });

export default model<INotification>('Notification', NotificationSchema);
