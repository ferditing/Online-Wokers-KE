// src/routes/verification.routes.ts
import { Router } from 'express';
import { createVerificationRequest, upload } from '../controllers/verification.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import * as adminCtrl from '../controllers/admin.controller';

const router = Router();

router.post('/request', requireAuth, upload.single('file'), createVerificationRequest);

// admin routes
router.get('/admin/verification', requireAdmin, adminCtrl.listVerificationRequests);
router.patch('/admin/verification/:id', requireAdmin, adminCtrl.updateVerificationRequest);
router.get('/admin/users', requireAdmin, adminCtrl.listUsers);

export default router;
