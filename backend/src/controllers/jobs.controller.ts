import { Request, Response } from 'express';
import Job from '../models/Job';

export async function createJob(req: Request, res: Response) {
  const { title, description, budget, currency } = req.body;
  const employerId = (req as any).userId;
  if (!title || !description || !budget) return res.status(400).json({ message: 'Missing fields' });
  const job = await Job.create({ title, description, budget, currency: currency || 'KES', employer: employerId });
  res.status(201).json({ job });
}

export async function listJobs(req: Request, res: Response) {
  const jobs = await Job.find().sort({ createdAt: -1 }).limit(50).populate('employer', 'name email');
  res.json({ jobs });
}

export async function getJob(req: Request, res: Response) {
  const job = await Job.findById(req.params.id).populate('employer', 'name email');
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ job });
}
