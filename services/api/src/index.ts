import Fastify from 'fastify';
import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import { loadConfig, type AppConfig } from './config.js';
import { dbPlugin } from './plugins/db.js';
import { clerkPlugin } from './plugins/clerk.js';
import { r2Plugin } from './plugins/r2.js';
import { bookmarkRoutes } from './routes/bookmarks.js';
import { tagRoutes } from './routes/tags.js';
import { UserRepository } from './repositories/UserRepository.js';
import { BookmarkRepository } from './repositories/BookmarkRepository.js';
import { TagRepository } from './repositories/TagRepository.js';
import { BookmarkService } from './services/BookmarkService.js';
import { R2StorageService } from './services/R2StorageService.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    userRepository: UserRepository;
  }
}

async function buildApp() {
  const config = loadConfig();

  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  // Decorate with config first so plugins can access it
  app.decorate('config', config);

  // Core plugins
  await app.register(cors, {
    origin: ['http://localhost:4103'],
    credentials: true,
  });
  await app.register(fp(dbPlugin));
  await app.register(fp(r2Plugin));

  // Repositories
  const userRepository = new UserRepository(app.db);
  const bookmarkRepository = new BookmarkRepository(app.db);
  const tagRepository = new TagRepository(app.db);
  app.decorate('userRepository', userRepository);

  // Services
  const r2Service = new R2StorageService(app.s3, config.r2.bucketName);
  const bookmarkService = new BookmarkService(
    bookmarkRepository,
    tagRepository,
    r2Service,
    config.r2.bucketName,
  );

  // Auth (depends on userRepository being registered)
  await app.register(fp(clerkPlugin));

  // Health check (no auth)
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Routes
  await bookmarkRoutes(app, bookmarkService);
  await tagRoutes(app, tagRepository);

  return app;
}

async function main() {
  const app = await buildApp();
  const config = app.config;

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
