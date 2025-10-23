import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// convenience methods
export default {
  info: (msg: string, meta?: any) => logger.info(msg, meta),
  error: (msg: string, meta?: any) => logger.error(msg, meta),
  warn: (msg: string, meta?: any) => logger.warn(msg, meta),
  http: (msg: string) => logger.info(msg),
};
