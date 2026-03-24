import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createClient, type DrizzleClient } from '@stashr/db';

declare module 'fastify' {
  interface FastifyInstance {
    db: DrizzleClient;
  }
}

export const dbPlugin = fp(async (app: FastifyInstance) => {
  const client = createClient(app.config.databaseUrl);
  app.decorate('db', client);
});
