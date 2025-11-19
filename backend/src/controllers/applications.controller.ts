// src/controllers/applications.controller.ts
import { Request, Response } from 'express';
import Application from '../models/Application';
import Job from '../models/Job';
import Notification from '../models/Notification';
import logger from '../utils/logger';
import User from '../models/User';
import { getIo } from '../utils/socket';

// Helper function to create notification and emit real-time event
async function createNotification(userId: string, type: string, message: string, relatedId?: string) {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      message,
      relatedId
    });

    // Emit real-time notification
    const io = getIo();
    if (io) {
      io.to(userId).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
  }
}

// src/controllers/applications.controller.ts (replace existing applyToJob)
export async function applyToJob(req: Request, res: Response) {
  try {
    const jobId = req.params.jobId || req.params.id; // robust param pick
    const workerId = (req as any).userId;
    if (!workerId) return res.status(401).json({ message: 'Unauthorized' });

    const { coverMessage = '', proposedPrice } = req.body; // default to empty string

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ message: 'Job is not open for applications' });

    const worker = await User.findById(workerId).select('verified skills role');
    if (!worker) return res.status(404).json({ message: 'User not found' });
    if (worker.role !== 'worker') return res.status(403).json({ message: 'Only workers can apply' });
    if (!worker.verified) return res.status(403).json({ message: 'You must be verified before applying' });
    if (!Array.isArray(worker.skills) || worker.skills.length < 3) {
      return res.status(400).json({ message: 'Complete your profile with at least 3 skills before applying' });
    }

    const already = await Application.findOne({ jobId, worker: workerId });
    if (already) return res.status(400).json({ message: 'You have already applied to this job' });

    const application = await Application.create({
      jobId,
      worker: workerId,
      coverMessage,
      proposedPrice,
      status: 'applied'
    });

    const populated = await application.populate('worker', 'name email skills');

    // Create notification for employer
    const employerId = job.employer.toString();
    const workerName = worker?.name || 'A worker';

    await createNotification(
      employerId,
      'new_application',
      `${workerName} has applied to your job "${job.title}"`,
      jobId
    );

    return res.status(201).json({ application: populated });
  } catch (err: any) {
    logger.error('applyToJob error', err);
    // include err.message for debugging (safe in dev). Remove detail in production.
    return res.status(500).json({ message: 'Could not apply to job', detail: err?.message ?? String(err) });
  }
}


export async function acceptApplication(req: Request, res: Response) {
  try {
    const { appId } = req.params;
    const userId = (req as any).userId;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    const application = await Application.findById(appId).populate('jobId', 'employer status title').populate('worker', 'name');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const job = application.jobId as any;
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== userId) return res.status(403).json({ message: 'Only employer can update applications' });

    const previousStatus = application.status;
    application.status = status;
    await application.save();

    if (status === 'accepted') {
      // set job in_progress and assign worker
      job.status = 'in_progress';
      (job as any).assignedWorker = application.worker;
      await job.save();
    }

    const populatedApp = await application.populate('worker', 'name email');

    // Create notification for worker
    const workerId = application.worker.toString();
    const jobTitle = job.title;
    const workerName = (application.worker as any).name;

    if (status === 'accepted') {
      await createNotification(
        workerId,
        'application_accepted',
        `Your application for "${jobTitle}" has been accepted!`,
        job._id.toString()
      );
    } else if (status === 'rejected') {
      await createNotification(
        workerId,
        'application_rejected',
        `Your application for "${jobTitle}" has been rejected.`,
        job._id.toString()
      );
    }

    return res.json({ application: populatedApp });
  } catch (err: any) {
    logger.error('acceptApplication error', err);
    return res.status(500).json({ message: 'Could not update application' });
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

    // Create notification for employer
    const employerId = (job.employer as any).toString();
    const workerName = (await User.findById(userId).select('name'))?.name || 'A worker';

    await createNotification(
      employerId,
      'submission_received',
      `${workerName} has submitted deliverables for "${job.title}"`,
      jobId
    );

    // Optionally update job status to 'completed' only after employer approves/release funds.
    // We'll keep job.status = in_progress until employer explicitly completes it.

    return res.json({ message: 'Submission received', submissionId: application._id });
  } catch (err: any) {
    logger.error('submitDeliverable error', err);
    return res.status(500).json({ message: 'Could not submit deliverable' });
  }
}

export async function approveDeliverable(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    const userId = (req as any).userId;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== userId) return res.status(403).json({ message: 'Only employer can approve deliverables' });
    if (job.status !== 'in_progress') return res.status(400).json({ message: 'Job is not in progress' });

    // find accepted application with submission
    const application = await Application.findOne({ jobId, status: 'accepted' }).populate('worker', 'name email');
    if (!application) return res.status(404).json({ message: 'No accepted application found for this job' });
    if (!application.submission) return res.status(400).json({ message: 'No submission found to approve' });

    // update job status to completed
    job.status = 'completed';
    await job.save();

    // optionally add approval timestamp to submission
    application.submission.approvedAt = new Date();
    await application.save();

    const populatedJob = await Job.findById(jobId).populate('employer', 'name email');

    return res.json({ message: 'Deliverable approved', job: populatedJob, application });
  } catch (err: any) {
    logger.error('approveDeliverable error', err);
    return res.status(500).json({ message: 'Could not approve deliverable' });
  }
}

export async function approveSubmission(req: Request, res: Response) {
  try {
    const { appId } = req.params;
    const userId = (req as any).userId;

    const application = await Application.findById(appId).populate('jobId', 'employer status');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const job = application.jobId as any;
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== userId) return res.status(403).json({ message: 'Only employer can approve submissions' });
    if (job.status !== 'in_progress') return res.status(400).json({ message: 'Job is not in progress' });
    if (!application.submission) return res.status(400).json({ message: 'No submission found to approve' });

    // add approval timestamp to submission
    application.submission.approvedAt = new Date();
    await application.save();

    // Create notification for worker
    const workerId = application.worker.toString();
    const jobTitle = (application.jobId as any).title;

    await createNotification(
      workerId,
      'submission_approved',
      `Your submission for "${jobTitle}" has been approved!`,
      application.jobId.toString()
    );

    // optionally update job status to completed if all deliverables are approved
    // for now, keep job in_progress until employer explicitly completes it

    const populatedApp = await application.populate('worker', 'name email');

    return res.json({ message: 'Submission approved', application: populatedApp });
  } catch (err: any) {
    logger.error('approveSubmission error', err);
    return res.status(500).json({ message: 'Could not approve submission' });
  }
}

/**
 * GET /api/applications
 * query: worker, employer, jobId, limit
 * returns: { applications: Application[] }
 */
export async function listApplications(req: Request, res: Response) {
  try {
    const { worker, employer, jobId, limit = 50 } = req.query as any;
    const q: any = {};

    if (worker) q.worker = worker;
    if (jobId) q.jobId = jobId;
    // if employer provided, we find jobs by that employer and then filter by jobId in that set
    if (employer) {
      const jobs = await Job.find({ employer }).select("_id");
      q.jobId = { $in: jobs.map(j => j._id) };
    }

    const apps = await Application.find(q)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate({ path: "worker", select: "name email skills verified" })
      .populate({ path: "jobId", select: "title employer" });

    return res.json({ applications: apps });
  } catch (err: any) {
    logger.error("listApplications error", err);
    return res.status(500).json({ message: "Could not list applications" });
  }
}
