import { Request, Response } from 'express';
import Notification from '../models/Notification';
import logger from '../utils/logger';

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { limit = 50, unreadOnly = false } = req.query;

    const query: any = { user: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('relatedId', 'title'); // populate job title if relatedId is a job

    return res.json({ notifications });
  } catch (err: any) {
    logger.error('getNotifications error', err);
    return res.status(500).json({ message: 'Could not fetch notifications' });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json({ notification });
  } catch (err: any) {
    logger.error('markAsRead error', err);
    return res.status(500).json({ message: 'Could not mark notification as read' });
  }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the user
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    return res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    logger.error('markAllAsRead error', err);
    return res.status(500).json({ message: 'Could not mark all notifications as read' });
  }
}

/**
 * Helper function to create notifications
 */
export async function createNotification(userId: string, type: string, message: string, relatedId?: string) {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      message,
      relatedId
    });

    // Emit real-time notification if socket is available
    const io = require('../utils/socket').getIo();
    if (io) {
      io.to(userId).emit('notification', notification);
    }

    return notification;
  } catch (err: any) {
    logger.error('createNotification error', err);
    throw err;
  }
}
