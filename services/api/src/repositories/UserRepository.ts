import { eq } from 'drizzle-orm';
import { users, type User, type DrizzleClient } from '@stashr/db';

export class UserRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByClerkId(clerkUserId: string): Promise<User | undefined> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });
    return result;
  }

  async findOrCreate(clerkUserId: string, email?: string): Promise<User> {
    const existing = await this.findByClerkId(clerkUserId);
    if (existing) return existing;

    const [created] = await this.db
      .insert(users)
      .values({ clerkUserId, email: email ?? null })
      .returning();

    if (!created) throw new Error('Failed to create user');
    return created;
  }
}
