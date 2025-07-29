// api/login.ts
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Busca o usuário no banco de dados pelo username
    const { rows } = await sql`
      SELECT id, username, password, status FROM users WHERE username = ${username};
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401, // Não autorizado
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = rows[0];

    // Compara a senha enviada com o hash salvo no banco
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid || user.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Se a senha for válida, retorna os dados do usuário (sem a senha)
    return new Response(JSON.stringify({
      id: user.id,
      username: user.username,
      isAdmin: user.username === 'admin', // Simples verificação de admin
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Login failed', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}