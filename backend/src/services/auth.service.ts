import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';

export async function registerUser(name: string, email: string, password: string, role: IUser['role']) {
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email already in use');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const user = await User.create({ name, email, passwordHash, role });
  return user;
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function validateUser(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) return null;
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;
  return user;
}
