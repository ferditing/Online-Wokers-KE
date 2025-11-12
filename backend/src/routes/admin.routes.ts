// backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { listVerifications, updateVerification, bulkUpdateVerifications, listUsers } from '../controllers/admin.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

router.get('/verification', listVerifications);
router.patch('/verification/:id', updateVerification);
router.patch('/verification/bulk', bulkUpdateVerifications);

router.get('/users', listUsers);

export default router;
