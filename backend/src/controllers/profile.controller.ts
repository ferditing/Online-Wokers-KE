// src/controllers/profile.controller.ts
import { Request, Response } from 'express';
import User from '../models/User';
import Skill from '../models/Skill';
import logger from '../utils/logger';

/**
 * PATCH /api/profile
 * body: { name?, phone?, idNumber?, skills?: string[] } - skills are skill keys
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { name, phone, idNumber, skills } = req.body;

    // if skills provided, validate they exist
    if (skills && !Array.isArray(skills)) return res.status(400).json({ message: 'skills must be array' });

    if (skills) {
      // ensure at least 3 skills for workers only
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.role === 'worker' && skills.length < 3) {
        return res.status(400).json({ message: 'Workers must select at least 3 skills' });
      }

      // verify skills exist in Skill collection (best-effort)
      const found = await Skill.countDocuments({ key: { $in: skills } });
      if (found !== skills.length) return res.status(400).json({ message: 'One or more skills are invalid' });
    }

    const update: any = {};
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (idNumber) update.idNumber = idNumber;
    if (skills) update.skills = skills;

    const updated = await User.findByIdAndUpdate(userId, update, { new: true }).select('-passwordHash');
    res.json({ user: updated });
  } catch (err: any) {
    logger.error('updateProfile error', err);
    res.status(500).json({ message: 'Could not update profile' });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err: any) {
    logger.error('getProfile error', err);
    res.status(500).json({ message: 'Could not fetch profile' });
  }
}
