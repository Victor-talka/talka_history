// api/users.ts
import { sql } from '@vercel/postgres';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { rows: users } = await sql`
      SELECT id, username, status, created_at FROM users ORDER BY created_at ASC;
    `;
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}