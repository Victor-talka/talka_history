import { sql } from '@vercel/postgres';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { username, password } = await request.json();

    // --- MUDANÇA PARA TESTE ---
    // Vamos procurar o utilizador, mas ignorar a senha por agora
    const { rows } = await sql`
      SELECT id, username, status FROM users WHERE username = ${username};
    `;

    if (rows.length === 0) {
      // Se o utilizador não for encontrado, as credenciais são inválidas
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = rows[0];

    // Se o utilizador existir, vamos simplesmente permitir o login (APENAS PARA TESTE)
    return new Response(JSON.stringify({
      id: user.id,
      username: user.username,
      isAdmin: user.username === 'admin',
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Login failed', details: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}