// backend/src/controllers/verification.controller.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Verification from '../models/Verification';
import logger from '../utils/logger';
import User from '../models/User';

// Ensure uploads dir exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * POST /api/verification/request
 * Accepts multipart/form-data: file, type (id|qualification)
 * Requires authentication (req.userId must be set by auth middleware)
 */
export async function uploadVerification(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const type = req.body.type || 'id';
    if (!req.file) return res.status(400).json({ message: 'file is required' });

    // Save file from multer (req.file.buffer or req.file.path)
    // If using diskStorage, req.file.path is present; otherwise write buffer
    const filename = req.file.filename || `${Date.now()}-${req.file.originalname}`;
    const dest = req.file.path ? req.file.path : path.join(UPLOAD_DIR, filename);

    // If multer used memoryStorage, write buffer to disk
    if (!req.file.path && req.file.buffer) {
      fs.writeFileSync(dest, req.file.buffer);
    }

    // fileUrl — for now serve from /uploads/<filename>
    const fileUrl = `/uploads/${path.basename(dest)}`;

    const ver = await Verification.create({
      userId,
      type,
      fileUrl,
      status: 'pending'
    });

    // Optionally, you could notify admins via socket here

    return res.status(201).json({ verification: ver });
  } catch (err: any) {
    logger.error('uploadVerification', err);
    return res.status(500).json({ message: 'Could not upload verification' });
  }
}

/**
 * GET /api/verification
 * List verifications for the authenticated user
 */
export async function listUserVerifications(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const items = await Verification.find({ userId }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err: any) {
    logger.error('listUserVerifications', err);
    return res.status(500).json({ message: 'Could not list verifications' });
  }
}

/**
 * GET /api/verification/:id
 * Get a single verification (user must own it or be admin)
 */
export async function getVerification(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const userId = (req as any).userId;
    const userRole = (req as any).userRole || (req as any).user?.role;

    const ver = await Verification.findById(id).populate('userId', 'name email verified');
    if (!ver) return res.status(404).json({ message: 'Verification not found' });

    // Allow access if owner or admin
    if (String(ver.userId._id || ver.userId) !== String(userId) && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json({ verification: ver });
  } catch (err: any) {
    logger.error('getVerification', err);
    return res.status(500).json({ message: 'Could not fetch verification' });
  }
}
