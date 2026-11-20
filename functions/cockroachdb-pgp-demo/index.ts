import { withSupabase } from 'npm:@supabase/server@1'
import { readMessage, decrypt } from 'https://unpkg.com/openpgp@6.3.1/dist/openpgp.min.mjs'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405)
    }

    let id: unknown
    let passphrase: unknown
    try {
      ;({ id, passphrase } = await req.json())
    } catch {
      id = undefined
    }

    if (typeof id !== 'string' || !id.trim()) {
      return json({ error: 'id required' }, 400)
    }
    if (typeof passphrase !== 'string' || !passphrase.trim()) {
      return json({ error: 'passphrase required' }, 400)
    }

    const { data, error } = await ctx.supabaseAdmin.from('pgp_messages').select('content').eq('id', id).maybeSingle()
    if (error) {
      return json({ error: error.message }, 500)
    }
    if (!data) {
      return json({ error: 'not found' }, 404)
    }

    try {
      const message = await readMessage({ armoredMessage: data.content })
      const { data: content } = await decrypt({ message, passwords: [passphrase] })
      return json({ ok: true, content })
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : String(e) }, 400)
    }
  }),
}
