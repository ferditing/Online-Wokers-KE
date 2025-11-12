// src/routes/jobs.routes.ts
import { Router } from 'express';
import * as jobsCtrl from '../controllers/jobs.controller';
import * as appsCtrl from '../controllers/applications.controller';
import { createReview, listWorkerReviews } from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { upload } from '../controllers/verification.controller'; // if you allow file uploads here

const router = Router();

// Job CRUD routes
router.post('/', requireAuth, jobsCtrl.createJob);
router.get('/', jobsCtrl.listJobs);
router.get('/:id', jobsCtrl.getJob);

// Application routes
router.get('/:id/applications', requireAuth, jobsCtrl.getJobApplications);
router.post('/:jobId/apply', requireAuth, appsCtrl.applyToJob);
router.patch('/:jobId/applications/:appId/accept', requireAuth, appsCtrl.acceptApplication);
router.patch('/:jobId/applications/:appId/reject', requireAuth, appsCtrl.rejectApplication);

// Review routes
router.post('/:jobId/review', requireAuth, createReview);
router.get('/worker/:id/reviews', listWorkerReviews);

// Submission routes
router.post('/:jobId/submit', requireAuth, appsCtrl.submitDeliverable);

export default router;
