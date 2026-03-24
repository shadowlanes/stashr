import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { BookmarkService } from '../services/BookmarkService.js';

const saveBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  domain: z.string().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  readTimeMinutes: z.number().int().nonnegative().optional(),
  content: z.string().optional(),
  tagNames: z.array(z.string()).optional(),
});

const updateBookmarkSchema = z.object({
  isArchived: z.boolean().optional(),
  isRead: z.boolean().optional(),
  tagNames: z.array(z.string()).optional(),
});

const listQuerySchema = z.object({
  archived: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  tagId: z.string().optional(),
  search: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 0)),
});

export async function bookmarkRoutes(
  app: FastifyInstance,
  bookmarkService: BookmarkService,
): Promise<void> {
  // POST /bookmarks — save a new bookmark
  app.post('/bookmarks', async (request, reply) => {
    const body = saveBookmarkSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const bookmark = await bookmarkService.save({
      userId: request.auth.dbUser.id,
      ...body.data,
    });

    return reply.status(201).send(bookmark);
  });

  // GET /bookmarks — list bookmarks
  app.get('/bookmarks', async (request, reply) => {
    const query = listQuerySchema.safeParse(request.query);
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() });

    const bookmarks = await bookmarkService.list({
      userId: request.auth.dbUser.id,
      isArchived: query.data.archived,
      tagId: query.data.tagId,
      search: query.data.search,
      limit: query.data.limit,
      offset: query.data.offset,
    });

    return reply.send(bookmarks);
  });

  // GET /bookmarks/:id — get a single bookmark
  app.get<{ Params: { id: string } }>('/bookmarks/:id', async (request, reply) => {
    const bookmark = await bookmarkService.getById(request.params.id, request.auth.dbUser.id);
    if (!bookmark) return reply.status(404).send({ error: 'Bookmark not found' });
    return reply.send(bookmark);
  });

  // GET /bookmarks/:id/content — stream article HTML from R2
  app.get<{ Params: { id: string } }>('/bookmarks/:id/content', async (request, reply) => {
    try {
      const stream = await bookmarkService.getContent(request.params.id, request.auth.dbUser.id);
      return reply.type('text/html').send(stream);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message === 'Bookmark not found') return reply.status(404).send({ error: message });
      if (message === 'Article content not available') return reply.status(404).send({ error: message });
      throw err;
    }
  });

  // PATCH /bookmarks/:id — update archive/read status or tags
  app.patch<{ Params: { id: string } }>('/bookmarks/:id', async (request, reply) => {
    const body = updateBookmarkSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const bookmark = await bookmarkService.update(
      request.params.id,
      request.auth.dbUser.id,
      body.data,
    );
    if (!bookmark) return reply.status(404).send({ error: 'Bookmark not found' });
    return reply.send(bookmark);
  });

  // DELETE /bookmarks/:id
  app.delete<{ Params: { id: string } }>('/bookmarks/:id', async (request, reply) => {
    await bookmarkService.delete(request.params.id, request.auth.dbUser.id);
    return reply.status(204).send();
  });
}
