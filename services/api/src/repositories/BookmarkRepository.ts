import { and, eq, ilike, desc } from 'drizzle-orm';
import { bookmarks, bookmarkTags, type Bookmark, type NewBookmark, type DrizzleClient } from '@stashr/db';

export interface BookmarkWithTags extends Bookmark {
  tags: Array<{ id: string; name: string }>;
}

export interface ListBookmarksOptions {
  userId: string;
  isArchived?: boolean;
  tagId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

type BookmarkWithRelations = Bookmark & {
  bookmarkTags: Array<{ tag: { id: string; name: string } }>;
};

function toBookmarkWithTags(row: BookmarkWithRelations): BookmarkWithTags {
  return {
    ...row,
    tags: row.bookmarkTags.map((bt) => ({ id: bt.tag.id, name: bt.tag.name })),
  };
}

export class BookmarkRepository {
  constructor(private readonly db: DrizzleClient) {}

  async create(data: NewBookmark): Promise<Bookmark> {
    const [bookmark] = await this.db.insert(bookmarks).values(data).returning();
    if (!bookmark) throw new Error('Failed to create bookmark');
    return bookmark;
  }

  async findById(id: string, userId: string): Promise<BookmarkWithTags | undefined> {
    const row = await this.db.query.bookmarks.findFirst({
      where: and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)),
      with: {
        bookmarkTags: {
          with: { tag: true },
        },
      },
    });

    if (!row) return undefined;
    return toBookmarkWithTags(row as BookmarkWithRelations);
  }

  async list(options: ListBookmarksOptions): Promise<BookmarkWithTags[]> {
    const { userId, isArchived = false, limit = 20, offset = 0 } = options;

    const rows = await this.db.query.bookmarks.findMany({
      where: and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.isArchived, isArchived),
        options.search ? ilike(bookmarks.title, `%${options.search}%`) : undefined,
      ),
      with: {
        bookmarkTags: {
          with: { tag: true },
        },
      },
      orderBy: [desc(bookmarks.savedAt)],
      limit,
      offset,
    });

    let results = (rows as BookmarkWithRelations[]).map(toBookmarkWithTags);

    if (options.tagId) {
      const tagId = options.tagId;
      results = results.filter((b) => b.tags.some((t) => t.id === tagId));
    }

    return results;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Pick<Bookmark, 'isArchived' | 'isRead' | 'r2Key' | 'title' | 'description'>>,
  ): Promise<Bookmark | undefined> {
    const [updated] = await this.db
      .update(bookmarks)
      .set(data)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
      .returning();
    return updated;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
      .returning();
    return deleted.length > 0;
  }

  async setTags(bookmarkId: string, tagIds: string[]): Promise<void> {
    await this.db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, bookmarkId));
    if (tagIds.length > 0) {
      await this.db.insert(bookmarkTags).values(tagIds.map((tagId) => ({ bookmarkId, tagId })));
    }
  }
}
