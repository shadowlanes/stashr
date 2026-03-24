import { and, eq } from 'drizzle-orm';
import { tags, type Tag, type NewTag, type DrizzleClient } from '@stashr/db';

export class TagRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findAllByUser(userId: string): Promise<Tag[]> {
    return this.db.query.tags.findMany({
      where: eq(tags.userId, userId),
      orderBy: tags.name,
    });
  }

  async findOrCreate(userId: string, name: string): Promise<Tag> {
    const existing = await this.db.query.tags.findFirst({
      where: and(eq(tags.userId, userId), eq(tags.name, name.toLowerCase().trim())),
    });
    if (existing) return existing;

    const [created] = await this.db
      .insert(tags)
      .values({ userId, name: name.toLowerCase().trim() })
      .returning();

    if (!created) throw new Error('Failed to create tag');
    return created;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .returning();
    return deleted.length > 0;
  }
}
