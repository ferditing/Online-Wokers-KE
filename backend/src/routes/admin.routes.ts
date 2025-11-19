// backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { listVerifications, updateVerification, bulkUpdateVerifications, listUsers, promoteUserToAdmin } from '../controllers/admin.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

router.get('/verification', listVerifications);
router.patch('/verification/:id', updateVerification);
router.patch('/verification/bulk', bulkUpdateVerifications);
router.post('/users/:id/promote', promoteUserToAdmin);

router.get('/users', listUsers);

// Admin payments routes
router.get('/payments', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const q: any = {};
    if (status) q.status = String(status);
    const payments = await require('../models/Payment').find(q).sort({ createdAt: -1 }).limit(Number(limit)).populate('userId', 'name email');
    return res.json({ payments });
  } catch (err: any) {
    console.error('Admin list payments error', err);
    return res.status(500).json({ message: 'Could not list payments' });
  }
});

export default router;
