import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { seedRoles } from './role.seed';
import { seedUsers } from './user.seed';
import { seedUserRoles } from './user-role.seed';
import * as schema from '../schema/index';

dotenv.config();

async function main() {
  console.log('🌱 Starting database seeder...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in the environment variables');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool, { schema });

  try {
    await seedRoles(db);
    await seedUsers(db);
    await seedUserRoles(db);
    console.log('✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
  } finally {
    await pool.end();
  }
}

main();
