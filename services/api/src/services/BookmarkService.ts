import type { BookmarkRepository, BookmarkWithTags, ListBookmarksOptions } from '../repositories/BookmarkRepository.js';
import type { TagRepository } from '../repositories/TagRepository.js';
import type { R2StorageService } from './R2StorageService.js';
import type { Bookmark } from '@stashr/db';
import type { Readable } from 'stream';

export interface SaveBookmarkInput {
  userId: string;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  domain?: string;
  wordCount?: number;
  readTimeMinutes?: number;
  content?: string; // cleaned HTML from Readability.js
  tagNames?: string[];
}

export interface UpdateBookmarkInput {
  isArchived?: boolean;
  isRead?: boolean;
  tagNames?: string[];
}

export class BookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly tagRepository: TagRepository,
    private readonly r2: R2StorageService,
    private readonly r2BucketName: string,
  ) {}

  async findExistingByUrl(userId: string, url: string): Promise<BookmarkWithTags | undefined> {
    const baseUrl = url.split('?')[0]!;
    const existing = await this.bookmarkRepository.findByBaseUrl(userId, baseUrl);
    if (!existing) return undefined;
    return this.bookmarkRepository.findById(existing.id, userId);
  }

  async save(input: SaveBookmarkInput): Promise<BookmarkWithTags> {
    const bookmark = await this.bookmarkRepository.create({
      userId: input.userId,
      url: input.url,
      title: input.title ?? null,
      description: input.description ?? null,
      thumbnail: input.thumbnail ?? null,
      domain: input.domain ?? null,
      wordCount: input.wordCount ?? null,
      readTimeMinutes: input.readTimeMinutes ?? null,
    });

    // Upload cleaned HTML to R2 if provided
    if (input.content) {
      const key = this.r2.buildKey(input.userId, bookmark.id);
      await this.r2.upload(key, input.content);
      await this.bookmarkRepository.update(bookmark.id, input.userId, { r2Key: key });
      bookmark.r2Key = key;
    }

    // Apply tags
    if (input.tagNames && input.tagNames.length > 0) {
      const tagIds = await this.resolveTagIds(input.userId, input.tagNames);
      await this.bookmarkRepository.setTags(bookmark.id, tagIds);
    }

    const saved = await this.bookmarkRepository.findById(bookmark.id, input.userId);
    if (!saved) throw new Error('Bookmark not found after creation');
    return saved;
  }

  async list(options: ListBookmarksOptions): Promise<BookmarkWithTags[]> {
    return this.bookmarkRepository.list(options);
  }

  async getById(id: string, userId: string): Promise<BookmarkWithTags | undefined> {
    return this.bookmarkRepository.findById(id, userId);
  }

  async getContent(id: string, userId: string): Promise<Readable> {
    const bookmark = await this.bookmarkRepository.findById(id, userId);
    if (!bookmark) throw new Error('Bookmark not found');
    if (!bookmark.r2Key) throw new Error('Article content not available');
    return this.r2.getStream(bookmark.r2Key);
  }

  async update(
    id: string,
    userId: string,
    input: UpdateBookmarkInput,
  ): Promise<BookmarkWithTags | undefined> {
    const fields: Partial<Pick<Bookmark, 'isArchived' | 'isRead'>> = {};
    if (input.isArchived !== undefined) fields.isArchived = input.isArchived;
    if (input.isRead !== undefined) fields.isRead = input.isRead;

    if (Object.keys(fields).length > 0) {
      await this.bookmarkRepository.update(id, userId, fields);
    }

    if (input.tagNames !== undefined) {
      const tagIds = await this.resolveTagIds(userId, input.tagNames);
      await this.bookmarkRepository.setTags(id, tagIds);
    }

    return this.bookmarkRepository.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const bookmark = await this.bookmarkRepository.findById(id, userId);
    if (!bookmark) return;

    if (bookmark.r2Key) {
      await this.r2.delete(bookmark.r2Key);
    }

    await this.bookmarkRepository.delete(id, userId);
  }

  private async resolveTagIds(userId: string, tagNames: string[]): Promise<string[]> {
    const resolved = await Promise.all(
      tagNames.map((name) => this.tagRepository.findOrCreate(userId, name)),
    );
    return resolved.map((t) => t.id);
  }
}
