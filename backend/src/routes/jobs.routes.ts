// src/routes/jobs.routes.ts
import { Router } from 'express';
import * as jobsCtrl from '../controllers/jobs.controller';
import * as appsCtrl from '../controllers/applications.controller';
import { createReview, listWorkerReviews } from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Job CRUD routes
router.post('/', requireAuth, jobsCtrl.createJob);
router.get('/', jobsCtrl.listJobs);
router.get('/:id', jobsCtrl.getJob);

// Application routes
router.get('/:jobId/applications', requireAuth, appsCtrl.listApplications);

// Review routes
router.post('/:jobId/review', requireAuth, createReview);
router.get('/worker/:id/reviews', listWorkerReviews);

// Submission routes
router.post('/:jobId/submit', requireAuth, appsCtrl.submitDeliverable);
router.patch('/:jobId/approve', requireAuth, appsCtrl.approveDeliverable);

export default router;
