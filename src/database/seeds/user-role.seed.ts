import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users, roles, userRoles } from '../schema/index';

export async function seedUserRoles(db: NodePgDatabase<any>) {
  console.log('Seeding user roles...');
  
  const allRoles = await db.select().from(roles);
  const adminRole = allRoles.find(r => r.name === 'Admin');

  const allUsers = await db.select().from(users);
  const adminUser = allUsers.find(u => u.email === 'admin@example.com');

  if (adminUser && adminRole) {
    await db.insert(userRoles).values([
      { userId: adminUser.id, roleId: adminRole.id }
    ]).onConflictDoNothing();
    console.log('✅ User Roles seeded');
  }
}
