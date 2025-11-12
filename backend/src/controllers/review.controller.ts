// backend/src/controllers/review.controller.ts
import { Request, Response } from 'express';
import Review from '../models/Review';
import Job from '../models/Job';
import User from '../models/User';
import logger from '../utils/logger';
import mongoose from 'mongoose';

/**
 * POST /api/jobs/:jobId/review
 * Body: { workerId, rating, comment }
 * Only employer who posted the job can submit a review for the assigned worker, and only after job.status === 'completed'
 */
export async function createReview(req: Request, res: Response) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const jobId = req.params.jobId;
    const userId = (req as any).userId; // employer posting the review
    const userRole = (req as any).user?.role || (req as any).userRole;

    const { workerId, rating, comment } = req.body;
    if (!workerId || !rating) return res.status(400).json({ message: 'workerId and rating are required' });
    const numericRating = Number(rating);
    if (!(numericRating >= 1 && numericRating <= 5)) return res.status(400).json({ message: 'rating must be between 1 and 5' });

    const job = await Job.findById(jobId).session(session);
    if (!job) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only job owner (employer) or admin can post review
    if (userRole !== 'admin' && String(job.employer) !== String(userId)) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Only employer who posted the job can review the worker' });
    }

    // Check the job had that worker assigned and is completed
    const assignedWorker = (job as any).assignedWorker;
    if (!assignedWorker || String(assignedWorker) !== String(workerId)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'This worker was not assigned to the job' });
    }
    if (job.status !== 'completed') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Job must be completed before reviewing' });
    }

    // Create review
    const review = await Review.create([{
      jobId,
      reviewer: userId,
      workerId,
      rating: numericRating,
      comment,
    }], { session });

    // Recalculate worker average rating and review count
    const agg = await Review.aggregate([
      { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
      { $group: { _id: '$workerId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]).session(session);

    const stats = agg[0] || { avgRating: numericRating, count: 1 };

    await User.findByIdAndUpdate(workerId, { $set: { avgRating: stats.avgRating, reviewCount: stats.count } }, { session });

    await session.commitTransaction();
    session.endSession();

    const populated = await Review.findById(review[0]._id).populate('reviewer', 'name email').populate('workerId', 'name email');

    return res.status(201).json({ review: populated });
  } catch (err: any) {
    logger.error('createReview', err);
    try { await session.abortTransaction(); session.endSession(); } catch (_) {}
    return res.status(500).json({ message: 'Could not create review' });
  }
}

/**
 * GET /api/workers/:id/reviews
 * Public endpoint to list reviews for a worker
 */
export async function listWorkerReviews(req: Request, res: Response) {
  try {
    const workerId = req.params.id;
    const reviews = await Review.find({ workerId }).sort({ createdAt: -1 }).populate('reviewer', 'name email');
    // include avg and count if you like (user document already updated)
    const user = await User.findById(workerId).select('avgRating reviewCount');
    return res.json({ reviews, avgRating: user?.avgRating ?? null, reviewCount: user?.reviewCount ?? 0 });
  } catch (err: any) {
    logger.error('listWorkerReviews', err);
    return res.status(500).json({ message: 'Could not list reviews' });
  }
}
