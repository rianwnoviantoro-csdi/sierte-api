import { pgTable, text, timestamp, integer, uuid, varchar } from 'drizzle-orm/pg-core';

export const kasRt = pgTable('kas_rt', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  amount: integer('amount').notNull(),
  notes: text('notes'),
  source: varchar('source', { length: 10 }).notNull().default('bot'), // 'bot' | 'api'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
