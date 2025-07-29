// api/login.ts
import { sql } from '@vercel/postgres';
import * as jose from 'jose';

export const config = {
  runtime: 'edge',
};

// Função para verificar a senha
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'uma-chave-secreta-forte-e-longa');
        const { payload } = await jose.jwtVerify(hash, secret);
        return payload.password === password;
    } catch (e) {
        // Se o token for inválido (não pôde ser verificado), a senha está incorreta.
        return false;
    }
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { rows } = await sql`
      SELECT id, username, password, status FROM users WHERE username = ${username};
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = rows[0];

    // Usando a nova função para verificar a senha
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid || user.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

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