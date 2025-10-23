import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import logger from '../utils/logger';

export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const user = await authService.registerUser(name, email, password, role || 'worker');
    const token = authService.signToken(user.id);
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err: any) {
    logger.error('Register error', err);
    res.status(400).json({ message: err.message || 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
  try {
    const user = await authService.validateUser(email, password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const token = authService.signToken(user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err: any) {
    logger.error('Login error', err);
    res.status(500).json({ message: 'Login failed' });
  }
}

export async function me(req: Request, res: Response) {
  // `req.userId` will be populated by auth middleware
  const userId = (req as any).userId;
  const user = await (await import('../models/User')).default.findById(userId).select('-passwordHash');
  res.json({ user });
}
