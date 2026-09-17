// Netlify Function serving the game API at /api/* for the Netlify deploy.
// Same routes as the local Express server: both call server/game.js.
import { createGame, describeError } from '../../../server/game.js'
import { createMemoryStore } from '../../../server/stores/memory.js'
import { createBlobsStore } from './lib/blobs-store.mjs'

let game = null

function getGame() {
  if (game) return game
  let store
  try {
    store = createBlobsStore()
  } catch (e) {
    // Without Blobs each function instance keeps its own state, which only
    // works for a single-instance demo. Surface it via storage: "memory".
    console.warn('Netlify Blobs unavailable, using in-memory state:', e.message)
    store = createMemoryStore()
  }
  game = createGame(store)
  return game
}

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

export default async (req) => {
  const url = new URL(req.url)

  let body = {}
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const text = await req.text()
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        return json({ error: 'Ogiltigt anrop.' }, 400)
      }
    }
  }

  try {
    const { status, body: out } = await getGame().handle({
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body,
    })
    return json(out, status)
  } catch (e) {
    console.error(`[api] ${req.method} ${url.pathname} failed:`, e)
    return json({ error: `Serverfel: ${describeError(e)}`, code: 'server_error' }, 500)
  }
}

export const config = {
  path: ['/api', '/api/*'],
}
