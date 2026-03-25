import { pgTable, text, timestamp, integer, boolean, varchar, uuid, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),            // unique() auto-creates an index
  password: text('password').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  lockedAt: timestamp('locked_at'),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('users_name_idx').on(t.name),                // search by name
  index('users_status_idx').on(t.status),            // filter by status
  index('users_is_locked_idx').on(t.isLocked),       // filter locked accounts
  index('users_locked_at_idx').on(t.lockedAt),       // filter lock time range
  index('users_created_at_idx').on(t.createdAt),     // sort / pagination
]);


