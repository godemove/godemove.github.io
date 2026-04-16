import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: text('post_id').notNull(),
  author: text('author').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  parentId: integer('parent_id'),
});

export const commentRateLimits = sqliteTable('comment_rate_limits', {
  ip: text('ip').primaryKey(),
  lastPostAt: integer('last_post_at', { mode: 'timestamp' }).notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type CommentRateLimit = typeof commentRateLimits.$inferSelect;
export type NewCommentRateLimit = typeof commentRateLimits.$inferInsert;
