// src/routes/payments.routes.ts
import { Router } from 'express';
import * as escrowCtrl from '../controllers/escrow.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

router.post('/escrow/initiate', requireAuth, escrowCtrl.initiateEscrow);
router.post('/escrow/webhook', escrowCtrl.escrowWebhook); // public
router.post('/escrow/:escrowId/release', requireAuth, escrowCtrl.releaseEscrow);
router.get('/escrow/:escrowId', requireAuth, escrowCtrl.getEscrow);

// admin release (stronger check)
router.post('/escrow/:escrowId/admin-release', requireAdmin, escrowCtrl.releaseEscrow);

export default router;
