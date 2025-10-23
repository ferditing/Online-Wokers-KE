import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onlineworkerske';

const server = http.createServer(app);

async function start() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');

    server.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
