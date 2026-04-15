import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { comments } from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
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

  let body: { postId?: string; author?: string; content?: string; parentId?: number | null };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
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

  try {
    await db.insert(comments).values({
      postId,
      author: trimmedAuthor,
      content: trimmedContent,
      parentId: parentId ?? null,
      createdAt: new Date(),
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
