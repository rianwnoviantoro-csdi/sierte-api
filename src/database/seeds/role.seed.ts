import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { roles } from '../schema/index';

export async function seedRoles(db: NodePgDatabase<any>) {
  console.log('Seeding roles...');
  await db.insert(roles).values([
    { name: 'Admin' },
    { name: 'User' },
  ]).onConflictDoNothing();
  console.log('✅ Roles seeded');
}
