// backend/src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import Verification from '../models/Verification';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';

// List verification requests with filters, search, pagination
export async function listVerifications(req: Request, res: Response) {
  try {
    const q = (req.query.q as string | undefined) || undefined;
    const type = (req.query.type as string | undefined);
    const status = (req.query.status as string | undefined);
    const limit = Math.min(parseInt((req.query.limit as string) || '50'), 200);
    const offset = parseInt((req.query.offset as string) || '0');
    const sort = (req.query.sort as string) || '-createdAt'; // e.g., createdAt desc

    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (q) {
      // support search by user name or fileUrl
      const userMatch = { name: new RegExp(q, 'i') };
      // We'll join with populate, but simpler: search fileUrl or populate and filter in JS (safe for moderate sizes)
      filter.$or = [{ fileUrl: new RegExp(q, 'i') }];
    }

    const query = Verification.find(filter)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .populate('userId', 'name email verified skills');

    const items = await query.exec();
    const total = await Verification.countDocuments(filter);

    return res.json({ items, total, limit, offset });
  } catch (err: any) {
    logger.error('listVerifications', err);
    return res.status(500).json({ message: 'Could not list verifications' });
  }
}

// Update a verification (approve/reject)
export async function updateVerification(req: Request, res: Response) {
  try {
    const adminId = (req as any).userId;
    const id = req.params.id;
    const { status, comments } = req.body;
    if (!['approved','rejected','pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ver = await Verification.findById(id);
    if (!ver) return res.status(404).json({ message: 'Verification not found' });

    ver.status = status;
    if (typeof comments === 'string') ver.comments = comments;
    await ver.save();

    // If approved -> mark user.verified = true
    if (status === 'approved') {
      await User.findByIdAndUpdate(ver.userId, { verified: true }, { new: true });
    }

    // Write audit log
    await AuditLog.create({
      actor: adminId,
      action: 'verification:update',
      targetType: 'verification',
      targetId: id,
      details: { status, comments }
    });

    // (Optional) Emit socket.io event — handled elsewhere if you integrate io
    // e.g., io.emit('verification:updated', { id, status });

    const populated = await Verification.findById(id).populate('userId', 'name email verified');
    return res.json({ verification: populated });
  } catch (err: any) {
    logger.error('updateVerification', err);
    return res.status(500).json({ message: 'Could not update verification' });
  }
}

// Bulk update verifications
export async function bulkUpdateVerifications(req: Request, res: Response) {
  try {
    const adminId = (req as any).userId;
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'ids array required' });
    if (!['approved','rejected','pending'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const result = await Verification.updateMany({ _id: { $in: ids } }, { $set: { status } });
    // If approved, set multiple users verified
    if (status === 'approved') {
      const docs = await Verification.find({ _id: { $in: ids } });
      const userIds = Array.from(new Set(docs.map(d => String(d.userId))));
      await User.updateMany({ _id: { $in: userIds } }, { $set: { verified: true }});
    }

    await AuditLog.create({
      actor: adminId,
      action: 'verification:bulk_update',
      details: { ids, status }
    });

    return res.json({ ok: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'Bulk update failed' });
  }
}

// List users (with q and limit)
export async function listUsers(req: Request, res: Response) {
  try {
    const q = (req.query.q as string | undefined);
    const limit = Math.min(parseInt((req.query.limit as string) || '10'), 200);
    const offset = parseInt((req.query.offset as string) || '0');

    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { idNumber: new RegExp(q, 'i') }
      ];
    }

    const users = await User.find(filter).select('-passwordHash').skip(offset).limit(limit).sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    return res.json({ users, total, limit, offset });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'Could not list users' });
  }
}
