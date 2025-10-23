import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import config from '../config';
import { randomUUID } from 'crypto';

const client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId!,
    secretAccessKey: config.aws.secretAccessKey!,
  },
});

export async function uploadFile(buffer: Buffer, filename: string, mimeType: string) {
  const key = `${Date.now()}-${randomUUID()}-${filename}`;
  const cmd = new PutObjectCommand({
    Bucket: config.aws.s3Bucket!,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });
  await client.send(cmd);
  return { url: `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`, key };
}
