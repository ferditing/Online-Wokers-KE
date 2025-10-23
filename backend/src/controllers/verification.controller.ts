// src/controllers/verification.controller.ts
import { Request, Response } from 'express';
import multer from 'multer';
import { uploadFile } from '../services/s3.service';
import VerificationRequest from '../models/VerificationRequest';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

const storage = multer.memoryStorage();
export const upload = multer({ storage });

/**
 * POST /api/verification/request
 * multipart/form-data: file + type
 */
export async function createVerificationRequest(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const type = req.body.type || 'id';
    const file = (req as any).file;

    if (!file) return res.status(400).json({ message: 'file is required' });

    // try upload to S3; fall back to saving locally
    let url = '';
    try {
      const result = await uploadFile(file.buffer, file.originalname, file.mimetype);
      url = result.url;
    } catch (s3err) {
      logger.warn('S3 upload failed, falling back to local storage', s3err);
      // ensure uploads dir exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
      const filename = `${Date.now()}-${file.originalname}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, file.buffer);
      url = `file://${filepath}`;
    }

    const vr = await VerificationRequest.create({
      userId,
      type,
      fileUrl: url,
      status: 'pending',
    });

    return res.status(201).json(vr);
  } catch (err: any) {
    logger.error('createVerificationRequest error', err);
    return res.status(500).json({ message: 'Could not create verification request' });
  }
}
