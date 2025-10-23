import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config';

const connection = new IORedis(config.redisUrl);
export const payoutQueue = new Queue('payouts', { connection });

// use payoutQueue.add({ jobId, amount }) to schedule payouts
