import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),             // unique() auto-creates an index
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('roles_created_at_idx').on(t.createdAt),     // sort / pagination
]);



