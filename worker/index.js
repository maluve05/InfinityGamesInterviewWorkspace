export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // API: Telemetry
    if (url.pathname === '/api/telemetry') {
      if (request.method === 'POST') {
        try {
          let body;
          try {
            body = await request.json();
          } catch {
            const raw = await request.text();
            body = JSON.parse(raw);
          }
          const events = Array.isArray(body) ? body : [body];

          const stmt = env.DB.prepare(
            'INSERT INTO telemetry (player_id, event, type, payload, created_at) VALUES (?, ?, ?, ?, ?)'
          );

          const batch = events.map((e) => {
            const playerId = e.player || 'demo_user';
            const eventName = e.event || e.type || 'unknown';
            const eventType = e.type || e.event || 'unknown';
            const ts = Number(e.ts) || Date.now();
            return stmt.bind(playerId, eventName, eventType, JSON.stringify(e), ts);
          });

          await env.DB.batch(batch);

          return new Response(JSON.stringify({ ok: true, count: events.length }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      if (request.method === 'GET') {
        try {
          const limit = Math.min(1000, parseInt(url.searchParams.get('limit') || '500', 10));
          const format = url.searchParams.get('format');
          const { results } = await env.DB.prepare(
            'SELECT * FROM telemetry ORDER BY created_at DESC LIMIT ?'
          ).bind(limit).all();

          if (format === 'jsonl') {
            const lines = (results || []).map((r) => r.payload).filter(Boolean).join('\n');
            return new Response(lines, {
              headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', ...corsHeaders },
            });
          }

          return new Response(JSON.stringify({ ok: true, count: results.length, events: results }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Static assets fallback
    return env.ASSETS.fetch(request);
  },
};
