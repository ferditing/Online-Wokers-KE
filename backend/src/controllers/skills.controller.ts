// src/controllers/skills.controller.ts
import { Request, Response } from 'express';
import Skill from '../models/Skill';
import logger from '../utils/logger';

export async function listSkills(req: Request, res: Response) {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    res.json({ skills });
  } catch (err: any) {
    logger.error('listSkills error', err);
    res.status(500).json({ message: 'Could not fetch skills' });
  }
}

export async function createSkill(req: Request, res: Response) {
  try {
    const { key, name, category } = req.body;
    if (!key || !name) return res.status(400).json({ message: 'key and name required' });
    const existing = await Skill.findOne({ key });
    if (existing) return res.status(400).json({ message: 'Skill already exists' });
    const skill = await Skill.create({ key, name, category });
    res.status(201).json(skill);
  } catch (err: any) {
    logger.error('createSkill error', err);
    res.status(500).json({ message: 'Could not create skill' });
  }
}
