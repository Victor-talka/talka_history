// api/delete-user.ts
import { sql } from '@vercel/postgres';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await sql`DELETE FROM users WHERE id = ${id};`;

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to delete user', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}