// api/conversations.ts
import { sql } from '@vercel/postgres';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        const { rows: conversations } = await sql`
            SELECT * FROM conversations
            WHERE owner_user_id = ${parseInt(userId)}
            ORDER BY last_timestamp DESC;
        `;

        for (const convo of conversations) {
            const { rows: messages } = await sql`
                SELECT * FROM messages
                WHERE conversation_id = ${convo.id}
                ORDER BY timestamp ASC;
            `;
            convo.messages = messages;
        }

        return new Response(JSON.stringify(conversations), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: "Failed to fetch conversations", details: error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}