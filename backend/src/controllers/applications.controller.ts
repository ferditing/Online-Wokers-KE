// src/controllers/applications.controller.ts
import { Request, Response } from 'express';
import Application from '../models/Application';
import Job from '../models/Job';
import logger from '../utils/logger';
import User from '../models/User';

export async function applyToJob(req: Request, res: Response) {
  try {
    const jobId = req.params.jobId;
    const workerId = (req as any).userId;
    const { coverMessage, proposedPrice } = req.body;

    // --------- NEW: profile & verification checks ----------
    // check user profile: must be verified and have 3+ skills
    const worker = await User.findById(workerId).select('verified skills role');
    if (!worker) return res.status(404).json({ message: 'User not found' });
    if (worker.role !== 'worker') return res.status(403).json({ message: 'Only workers can apply' });
    if (!worker.verified) return res.status(403).json({ message: 'You must be verified before applying' });
    if (!Array.isArray(worker.skills) || worker.skills.length < 3) {
      return res.status(400).json({ message: 'Complete your profile with at least 3 skills before applying' });
    }
    // -------------------------------------------------------

    if (!coverMessage) return res.status(400).json({ message: 'coverMessage is required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ message: 'Job is not open for applications' });

    // prevent duplicate applications
    const already = await Application.findOne({ jobId, worker: workerId });
    if (already) return res.status(400).json({ message: 'You have already applied to this job' });

    const application = await Application.create({
      jobId,
      worker: workerId,
      coverMessage,
      proposedPrice,
    });

    const populated = await application.populate('worker', 'name email');

    return res.status(201).json({ application: populated });
  } catch (err: any) {
    logger.error('applyToJob error', err);
    return res.status(500).json({ message: 'Could not apply to job' });
  }
}

export async function acceptApplication(req: Request, res: Response) {
  try {
    const { jobId, appId } = req.params;
    const userId = (req as any).userId;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== userId) return res.status(403).json({ message: 'Only employer can accept applications' });

    const application = await Application.findById(appId);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.jobId.toString() !== jobId) return res.status(400).json({ message: 'Application does not belong to this job' });

    application.status = 'accepted';
    await application.save();

    // set job in_progress and assign worker
    job.status = 'in_progress';
    (job as any).assignedWorker = application.worker;
    await job.save();

    const populatedApp = await application.populate('worker', 'name email');
    const populatedJob = await Job.findById(jobId).populate('employer', 'name email');

    return res.json({ job: populatedJob, application: populatedApp });
  } catch (err: any) {
    logger.error('acceptApplication error', err);
    return res.status(500).json({ message: 'Could not accept application' });
  }
}

export async function rejectApplication(req: Request, res: Response) {
  try {
    const { jobId, appId } = req.params;
    const userId = (req as any).userId;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== userId) return res.status(403).json({ message: 'Only employer can reject applications' });

    const application = await Application.findById(appId);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.jobId.toString() !== jobId) return res.status(400).json({ message: 'Application does not belong to this job' });

    application.status = 'rejected';
    await application.save();

    return res.json({ application });
  } catch (err: any) {
    logger.error('rejectApplication error', err);
    return res.status(500).json({ message: 'Could not reject application' });
  }
}

export async function submitDeliverable(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    const userId = (req as any).userId;
    const { files, notes } = req.body; // files = array of URLs

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // find accepted application for this worker and job
    const application = await Application.findOne({ jobId, worker: userId, status: 'accepted' });
    if (!application) return res.status(403).json({ message: 'No accepted application found for this worker' });

    application.submission = {
      files: Array.isArray(files) ? files : [],
      notes,
      submittedAt: new Date(),
    };
    await application.save();

    // Optionally update job status to 'completed' only after employer approves/release funds.
    // We'll keep job.status = in_progress until employer approves via release endpoint.

    return res.json({ message: 'Submission received', submissionId: application._id });
  } catch (err: any) {
    logger.error('submitDeliverable error', err);
    return res.status(500).json({ message: 'Could not submit deliverable' });
  }
}
