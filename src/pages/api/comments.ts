import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { comments, commentRateLimits } from '../../db/schema';
import { eq, desc, sql, and, gt } from 'drizzle-orm';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const db = drizzle(env.DB);
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
  }

  const url = new URL(request.url);
  const postId = url.searchParams.get('postId');
  if (!postId) {
    return new Response(JSON.stringify({ error: 'Missing postId' }), { status: 400 });
  }

  try {
    const results = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))
      .all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = drizzle(env.DB);
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
  }

  let body: { postId?: string; author?: string; content?: string; website?: string; parentId?: number | null };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  // Honeypot: if hidden field is filled, reject as spam
  if (body.website && body.website.trim().length > 0) {
    return new Response(JSON.stringify({ error: 'Spam detected' }), { status: 400 });
  }

  const { postId, author, content, parentId } = body;
  if (!postId || !author || !content) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const trimmedAuthor = author.trim();
  const trimmedContent = content.trim();
  if (trimmedAuthor.length === 0 || trimmedAuthor.length > 32) {
    return new Response(JSON.stringify({ error: 'Author must be 1-32 characters' }), { status: 400 });
  }
  if (trimmedContent.length === 0 || trimmedContent.length > 2000) {
    return new Response(JSON.stringify({ error: 'Content must be 1-2000 characters' }), { status: 400 });
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  try {
    // Rate limiting: 1 comment per IP per 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recent = await db
      .select()
      .from(commentRateLimits)
      .where(and(
        eq(commentRateLimits.ip, ip),
        gt(commentRateLimits.lastPostAt, fiveMinutesAgo)
      ))
      .get();

    if (recent) {
      return new Response(JSON.stringify({ error: '评论太频繁，请 5 分钟后再试' }), { status: 429 });
    }

    await db.insert(comments).values({
      postId,
      author: trimmedAuthor,
      content: trimmedContent,
      parentId: parentId ?? null,
      createdAt: new Date(),
    });

    await db.insert(commentRateLimits)
      .values({ ip, lastPostAt: new Date() })
      .onConflictDoUpdate({
        target: commentRateLimits.ip,
        set: { lastPostAt: new Date() },
      });

    const [result] = await db
      .select()
      .from(comments)
      .where(sql`id = last_insert_rowid()`)
      .all();

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
