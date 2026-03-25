import { pgTable, primaryKey, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './user.schema';
import { roles } from './role.schema';

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.roleId] }),
  index('user_roles_user_id_idx').on(t.userId),
  index('user_roles_role_id_idx').on(t.roleId),
]);

