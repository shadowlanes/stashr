import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken } from '@clerk/backend';
import type { User } from '@stashr/db';

export interface AuthenticatedUser {
  clerkUserId: string;
  dbUser: User;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthenticatedUser;
  }
}

export const clerkPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest('auth', null);

  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.routeOptions.url === '/health') return;

    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: app.config.clerk.secretKey,
      });

      const clerkUserId = payload.sub;
      const dbUser = await app.userRepository.findOrCreate(clerkUserId);
      request.auth = { clerkUserId, dbUser };
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
  });
});
