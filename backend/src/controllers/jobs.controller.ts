// src/controllers/jobs.controller.ts
import { Request, Response } from 'express';
import Job from '../models/Job';
import User from '../models/User';
import Application from '../models/Application';
import logger from '../utils/logger';

/**
 * Helper: robust user id pick
 */
function pickUserId(req: Request) {
  const uid = (req as any).userId || (req as any).user?._id || (req as any).user?.id;
  return uid ? String(uid) : null;
}

/**
 * List jobs. Supports filters:
 *  - q (search)
 *  - status
 *  - employer (id)
 *  - category
 *  - limit, offset
 *
 * If an authenticated worker requests, returns matchScore and sorts by matchScore desc, then date.
 */
export async function listJobs(req: Request, res: Response) {
  try {
    const q = req.query.q as string | undefined;
    const status = req.query.status as string | undefined;
    const employer = req.query.employer as string | undefined;
    const category = req.query.category as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const filter: any = {};
    if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
    if (status) filter.status = status;
    if (employer) filter.employer = employer;
    if (category) filter.category = category;

    // compute total for pagination
    const total = await Job.countDocuments(filter);

    const userId = pickUserId(req);
    const authUser = userId ? await User.findById(userId).select('role skills') : null;

    // If request from an authenticated worker, compute matchScore
    if (authUser && authUser.role === 'worker') {
      const allJobs = await Job.find(filter).skip(offset).limit(limit).populate('employer', 'name email role createdAt');
      const userSkills = Array.isArray((authUser as any).skills) ? (authUser as any).skills : [];

      const jobsWithScore = allJobs.map(j => {
        const required: string[] = Array.isArray(j.requiredSkills) ? j.requiredSkills : [];
        const overlap = required.filter(s => userSkills.includes(s)).length;
        const matchScore = overlap;
        return { job: j, matchScore };
      });

      jobsWithScore.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return (b.job.createdAt?.getTime() ?? 0) - (a.job.createdAt?.getTime() ?? 0);
      });

      const jobs = jobsWithScore.map(item => ({ ...item.job.toObject(), matchScore: item.matchScore }));
      return res.json({ jobs, pagination: { total, limit, offset } });
    }

    // default listing (guest or non-worker)
    const jobs = await Job.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).populate('employer', 'name email role createdAt');
    return res.json({ jobs, pagination: { total, limit, offset } });
  } catch (err: any) {
    logger.error('listJobs error', err);
    res.status(500).json({ message: 'Could not list jobs' });
  }
}

export const createJob = async (req: Request, res: Response) => {
  try {
    const userId = pickUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    // basic validation: require title, budget, category, requiredSkills
    const { title, description, budget, currency, category, requiredSkills, verifyJob } = req.body;
    if (!title || !category || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: title, category, requiredSkills' });
    }

    // enforce max selected skills (3)
    if (requiredSkills.length > 3) {
      return res.status(400).json({ message: 'Select at most 3 skills for this job' });
    }

    const job = await Job.create({
      title,
      description,
      budget,
      currency: currency || 'KES',
      category,
      requiredSkills,
      employer: userId,
      status: 'open',
      verified: false // Always start as unverified
    });

    const populated = await Job.findById(job._id).populate('employer', 'name email role');
    res.status(201).json(populated);
  } catch (err: any) {
    logger.error('createJob error', err);
    res.status(500).json({ message: 'Could not create job' });
  }
};

export const getJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id).populate('employer', 'name email role');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err: any) {
    logger.error('getJob error', err);
    res.status(500).json({ message: 'Could not fetch job' });
  }
};

/**
 * GET /api/jobs/:id/applications
 * - Only employer who owns the job or admin can fetch applicants
 */
export async function getJobApplications(req: Request, res: Response) {
  try {
    const jobId = req.params.id;
    const userId = pickUserId(req);

    const job = await Job.findById(jobId).populate('employer', 'name email role');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // find requestor role by fetching user (robust; middleware may only attach userId)
    const requestor = userId ? await User.findById(userId).select('role') : null;
    const requestorRole = requestor?.role;

    // employer field might be populated object or id - normalize
    const employerId = job.employer && (job.employer as any)._id ? String((job.employer as any)._id) : String(job.employer);

    // Only allow employer who posted the job or admin
    if (requestorRole !== 'admin' && String(employerId) !== String(userId)) {
      return res.status(403).json({ message: 'Only job owner or admin can view applicants' });
    }

    // fetch applications for this job and populate worker basic info
    const applications = await Application.find({ jobId }).populate('worker', 'name email skills verified');
    return res.json({ applications });
  } catch (err: any) {
    logger.error('getJobApplications', err);
    return res.status(500).json({ message: 'Could not fetch applications' });
  }
}

/**
 * PATCH /api/jobs/:id
 * - Allow employer (owner) or admin to update some fields (title, description, budget, status)
 */
export const updateJob = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const actorId = pickUserId(req);
    if (!actorId) return res.status(401).json({ message: 'Unauthorized' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const actor = await User.findById(actorId).select('role');
    const actorRole = actor?.role;

    // owner or admin only
    const ownerId = String(job.employer);
    if (actorRole !== 'admin' && ownerId !== String(actorId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const allowed: any = {};
    const { title, description, budget, currency, status, requiredSkills, category } = req.body;
    if (title !== undefined) allowed.title = title;
    if (description !== undefined) allowed.description = description;
    if (budget !== undefined) allowed.budget = budget;
    if (currency !== undefined) allowed.currency = currency;
    if (status !== undefined) allowed.status = status;
    if (category !== undefined) allowed.category = category;
    if (requiredSkills !== undefined) {
      if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
        return res.status(400).json({ message: 'requiredSkills must be a non-empty array' });
      }
      if (requiredSkills.length > 3) {
        return res.status(400).json({ message: 'Select at most 3 skills for this job' });
      }
      allowed.requiredSkills = requiredSkills;
    }

    const updated = await Job.findByIdAndUpdate(jobId, { $set: allowed }, { new: true }).populate('employer', 'name email role');
    res.json(updated);
  } catch (err: any) {
    logger.error('updateJob error', err);
    res.status(500).json({ message: 'Could not update job' });
  }
};

export default {
  listJobs,
  createJob,
  getJob,
  getJobApplications,
  updateJob,
};
