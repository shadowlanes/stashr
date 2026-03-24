function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export interface AppConfig {
  port: number;
  databaseUrl: string;
  clerk: {
    secretKey: string;
    publishableKey: string;
  };
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    endpoint: string;
  };
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env['PORT'] ?? '3001', 10),
    databaseUrl: requireEnv('DATABASE_URL'),
    clerk: {
      secretKey: requireEnv('CLERK_SECRET_KEY'),
      publishableKey: requireEnv('CLERK_PUBLISHABLE_KEY'),
    },
    r2: {
      accountId: requireEnv('R2_ACCOUNT_ID'),
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
      bucketName: requireEnv('R2_BUCKET_NAME'),
      endpoint: requireEnv('R2_ENDPOINT'),
    },
  };
}
