// src/routes/jobs.routes.ts
import { Router } from 'express';
import * as jobsCtrl from '../controllers/jobs.controller';
import * as appsCtrl from '../controllers/applications.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { upload } from '../controllers/verification.controller'; // if you allow file uploads here

const router = Router();

router.post('/', requireAuth, jobsCtrl.createJob);
router.get('/', jobsCtrl.listJobs);
router.get('/:id', jobsCtrl.getJob);

// application & submission routes
router.post('/:jobId/apply', requireAuth, appsCtrl.applyToJob);
router.patch('/:jobId/applications/:appId/accept', requireAuth, appsCtrl.acceptApplication);
router.patch('/:jobId/applications/:appId/reject', requireAuth, appsCtrl.rejectApplication);

// worker submission (expects JSON with files[] or server receives file uploads elsewhere)
router.post('/:jobId/submit', requireAuth, appsCtrl.submitDeliverable);

export default router;
