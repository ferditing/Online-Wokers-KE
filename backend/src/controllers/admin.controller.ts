// src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import VerificationRequest from '../models/VerificationRequest';
import User from '../models/User';
import logger from '../utils/logger';

/**
 * GET /api/admin/verification
 */
export async function listVerificationRequests(req: Request, res: Response) {
  try {
    const items = await VerificationRequest.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(100).populate('userId', 'name email');
    return res.json({ items });
  } catch (err: any) {
    logger.error('listVerificationRequests error', err);
    return res.status(500).json({ message: 'Could not fetch verification requests' });
  }
}

/**
 * PATCH /api/admin/verification/:id
 * body: { status: 'approved'|'rejected', comments }
 */
export async function updateVerificationRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const vr = await VerificationRequest.findById(id);
    if (!vr) return res.status(404).json({ message: 'Verification request not found' });

    vr.status = status;
    vr.comments = comments;
    await vr.save();

    // if approved -> set user.verified = true
    if (status === 'approved') {
      await User.findByIdAndUpdate(vr.userId, { verified: true });
    }
    if (status === 'rejected') {
      await User.findByIdAndUpdate(vr.userId, { verified: false });
    }

    return res.json(vr);
  } catch (err: any) {
    logger.error('updateVerificationRequest error', err);
    return res.status(500).json({ message: 'Could not update verification request' });
  }
}

/**
 * GET /api/admin/users
 */
export async function listUsers(req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const users = await User.find().skip(offset).limit(limit).select('-passwordHash').sort({ createdAt: -1 });
    const total = await User.countDocuments();
    return res.json({ users, pagination: { total, limit, offset } });
  } catch (err: any) {
    logger.error('listUsers error', err);
    return res.status(500).json({ message: 'Could not list users' });
  }
}
