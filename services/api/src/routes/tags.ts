import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { TagRepository } from '../repositories/TagRepository.js';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

export async function tagRoutes(
  app: FastifyInstance,
  tagRepository: TagRepository,
): Promise<void> {
  // GET /tags
  app.get('/tags', async (request, reply) => {
    const tags = await tagRepository.findAllByUser(request.auth.dbUser.id);
    return reply.send(tags);
  });

  // POST /tags
  app.post('/tags', async (request, reply) => {
    const body = createTagSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const tag = await tagRepository.findOrCreate(request.auth.dbUser.id, body.data.name);
    return reply.status(201).send(tag);
  });

  // DELETE /tags/:id
  app.delete<{ Params: { id: string } }>('/tags/:id', async (request, reply) => {
    const deleted = await tagRepository.delete(request.params.id, request.auth.dbUser.id);
    if (!deleted) return reply.status(404).send({ error: 'Tag not found' });
    return reply.status(204).send();
  });
}
