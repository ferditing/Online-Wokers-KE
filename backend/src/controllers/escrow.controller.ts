// src/controllers/escrow.controller.ts
import { Request, Response } from 'express';
import Escrow from '../models/Escrow';
import Job from '../models/Job';
import logger from '../utils/logger';
import User from '../models/User';

export async function initiateEscrow(req: Request, res: Response) {
  try {
    const { jobId, amount, currency } = req.body;
    const employerId = (req as any).userId;
    if (!jobId || !amount) return res.status(400).json({ message: 'jobId and amount required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== employerId) return res.status(403).json({ message: 'Only job employer can initiate escrow' });

    const escrow = await Escrow.create({
      jobId,
      employerId,
      amount,
      currency: currency || 'KES',
      platformFeePercent: 25,
      status: 'pending',
    });

    return res.status(201).json(escrow);
  } catch (err: any) {
    logger.error('initiateEscrow error', err);
    return res.status(500).json({ message: 'Could not initiate escrow' });
  }
}

export async function getEscrow(req: Request, res: Response) {
  try {
    const { escrowId } = req.params;
    const e = await Escrow.findById(escrowId);
    if (!e) return res.status(404).json({ message: 'Escrow not found' });
    return res.json(e);
  } catch (err: any) {
    logger.error('getEscrow error', err);
    return res.status(500).json({ message: 'Could not fetch escrow' });
  }
}

/**
 * Webhook to receive payment provider notification.
 * Expecting body { escrowId, externalTxId, status }
 * If status === 'success' -> mark funded
 */
export async function escrowWebhook(req: Request, res: Response) {
  try {
    const { escrowId, externalTxId, status } = req.body;
    if (!escrowId || !externalTxId) return res.status(400).json({ message: 'escrowId and externalTxId required' });

    const escrow = await Escrow.findById(escrowId);
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });

    escrow.externalTxId = externalTxId;
    if (status === 'success' || status === 'ok' || status === 'completed') {
      escrow.status = 'funded';
    }
    await escrow.save();

    // TODO: notify employer & platform (queue)
    return res.json({ message: 'webhook processed' });
  } catch (err: any) {
    logger.error('escrowWebhook error', err);
    return res.status(500).json({ message: 'Webhook handling failed' });
  }
}

/**
 * Release funds: only employer who funded the escrow or admin can release.
 * Calculates platform fee and returns payout amounts.
 */
export async function releaseEscrow(req: Request, res: Response) {
  try {
    const { escrowId } = req.params;
    const userId = (req as any).userId;
    const isAdmin = (req as any).isAdmin === true; // optional, but requireAdmin middleware is preferred for admin flow

    const escrow = await Escrow.findById(escrowId);
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
    if (escrow.status !== 'funded') return res.status(400).json({ message: 'Escrow not funded' });

    if (!isAdmin && escrow.employerId.toString() !== userId) {
      return res.status(403).json({ message: 'Only employer or admin can release escrow' });
    }

    // compute fees
    const platformFee = Math.round((escrow.amount * escrow.platformFeePercent) / 100);
    const workerAmount = escrow.amount - platformFee;

    escrow.status = 'released';
    await escrow.save();

    // update job status to 'completed'
    const job = await Job.findById(escrow.jobId);
    if (job) {
      job.status = 'completed';
      await job.save();
    }

    // TODO: enqueue payout job that pays worker workerAmount (via Mpesa B2C)
    return res.json({ escrow, platformFee, workerAmount });
  } catch (err: any) {
    logger.error('releaseEscrow error', err);
    return res.status(500).json({ message: 'Could not release escrow' });
  }
}
