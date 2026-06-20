CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  parent_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

CREATE TABLE IF NOT EXISTS comment_rate_limits (
  ip TEXT PRIMARY KEY,
  last_post_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comment_rate_limits_last_post_at ON comment_rate_limits(last_post_at);
