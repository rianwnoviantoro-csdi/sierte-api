import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '../schema/index';

export async function seedUsers(db: NodePgDatabase<any>) {
  console.log('Seeding users...');
  await db.insert(users).values([
    {
      name: 'Super Administrator',
      email: 'admin@example.com',
      password: '$2b$10$sQTXrYrhKI6lFjI75HF0T.xEslzGTquuQWyF3.VSosslYe2MTuqGC', // plain text: Password1!
      status: 'active',
      isLocked: false,
    }
  ]).onConflictDoNothing();
  console.log('✅ Users seeded');
}
