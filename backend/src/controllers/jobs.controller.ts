// src/controllers/jobs.controller.ts
import { Request, Response } from 'express';
import Job from '../models/Job';
import User from '../models/User';
import Application from '../models/Application';
import logger from '../utils/logger';

/**
 * List jobs. If authenticated worker -> compute matchScore = overlap(user.skills, job.requiredSkills)
 * and sort by matchScore desc then createdAt desc.
 */
export async function listJobs(req: Request, res: Response) {
  try {
    const q = req.query.q as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const filter: any = {};
    if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
    if (status) filter.status = status;

    const userId = (req as any).userId;
    if (!userId) {
      // unauthenticated: simple listing
      const jobs = await Job.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).populate('employer','name email');
      return res.json({ jobs, pagination: { total: jobs.length, limit, offset } });
    }

    // Authenticated: compute matchScore if user is a worker and has skills
    const user = await User.findById(userId).select('role skills');
    const allJobs = await Job.find(filter).skip(offset).limit(limit).populate('employer','name email');

    const jobsWithScore = allJobs.map(job => {
      const required = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
      const userSkills = Array.isArray(user?.skills) ? user!.skills : [];
      const overlap = required.filter(s => userSkills.includes(s)).length;
      const matchScore = overlap; // simple score: count of overlaps
      return { job, matchScore };
    });

    // sort by matchScore desc, then createdAt desc
    jobsWithScore.sort((a,b) => {
        if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;  // Sort by matchScore desc
        }
        return b.job.createdAt.getTime() - a.job.createdAt.getTime(); // Then by date
    });

    // format for response: attach matchScore at root
    const jobs = jobsWithScore.map(item => ({ ...item.job.toObject(), matchScore: item.matchScore }));

    return res.json({ jobs, pagination: { total: jobs.length, limit, offset } });
  } catch (err: any) {
    logger.error('listJobs error', err);
    res.status(500).json({ message: 'Could not list jobs' });
  }
}

export const createJob = async (req: Request, res: Response) => {
    try {
        const job = await Job.create({
            ...req.body,
            employer: (req as any).userId
        });
        res.status(201).json(job);
    } catch (err: any) {
        logger.error('createJob error', err);
        res.status(500).json({ message: 'Could not create job' });
    }
};

export const getJob = async (req: Request, res: Response) => {
    try {
        const job = await Job.findById(req.params.id).populate('employer', 'name email');
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
        const userId = (req as any).userId;
        const userRole = (req as any).user?.role || (req as any).userRole;

        const job = await Job.findById(jobId).populate('employer', 'name email');
        if (!job) return res.status(404).json({ message: 'Job not found' });

        // Only allow employer who posted the job or admin
        if (userRole !== 'admin' && String(job.employer) !== String(userId)) {
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
