import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET', 'dev-only-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim()),
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  isProd: process.env.NODE_ENV === 'production',
  // Blob storage: 'disk' (default, dev + tests) or 's3' (S3/MinIO in the deployed stack).
  storageDriver: (process.env.STORAGE_DRIVER ?? 'disk') as 'disk' | 's3',
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? '', // e.g. http://minio:9000 (MinIO); empty for AWS
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'eoffice',
    accessKeyId: process.env.S3_ACCESS_KEY ?? '',
    secretAccessKey: process.env.S3_SECRET_KEY ?? '',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true', // MinIO needs path-style
  },
};
