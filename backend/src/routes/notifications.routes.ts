import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notifications.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Get notifications for authenticated user
router.get('/', requireAuth, getNotifications);

// Mark specific notification as read
router.patch('/:id/read', requireAuth, markAsRead);

// Mark all notifications as read
router.patch('/read-all', requireAuth, markAllAsRead);

export default router;
