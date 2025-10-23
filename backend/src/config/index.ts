import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || '4000',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/onlineworkerske',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.S3_BUCKET,
  },
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
