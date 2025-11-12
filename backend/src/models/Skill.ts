// src/models/Skill.ts
import { Schema, model, Document } from 'mongoose';

export interface ISkill extends Document {
  key: string;    // machine key e.g. "software_engineering"
  name: string;   // display name e.g. "Software Engineering"
  category?: string; // e.g. "ICT"
  createdAt: Date;
}

const SkillSchema = new Schema<ISkill>({
  key: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  category: { type: String },
}, { timestamps: true });

export default model<ISkill>('Skill', SkillSchema);
