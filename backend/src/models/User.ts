import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'worker' | 'employer' | 'admin';
  verified: boolean;
  phone?: string;
  idNumber?: string;
  qualifications?: { title: string; fileUrl: string }[];
  skills?: string[];
  avgRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['worker', 'employer', 'admin'], default: 'worker' },
  verified: { type: Boolean, default: false },
  phone: String,
  idNumber: String,
  qualifications: [{ title: String, fileUrl: String }],
  skills: [{ type: String}],
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

export default model<IUser>('User', UserSchema);
