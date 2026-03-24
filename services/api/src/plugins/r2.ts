import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { S3Client } from '@aws-sdk/client-s3';

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Client;
  }
}

export const r2Plugin = fp(async (app: FastifyInstance) => {
  const client = new S3Client({
    region: 'auto',
    endpoint: app.config.r2.endpoint,
    credentials: {
      accessKeyId: app.config.r2.accessKeyId,
      secretAccessKey: app.config.r2.secretAccessKey,
    },
  });

  app.decorate('s3', client);

  app.addHook('onClose', async () => {
    client.destroy();
  });
});
