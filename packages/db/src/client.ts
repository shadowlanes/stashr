import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type DrizzleClient = ReturnType<typeof createClient>;

export function createClient(connectionString: string): ReturnType<typeof drizzle<typeof schema>> {
  const sql = postgres(connectionString);
  return drizzle(sql, { schema });
}
