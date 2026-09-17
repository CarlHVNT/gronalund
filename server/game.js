// The whole game API as one framework-agnostic request handler, so the same
// logic runs behind Express locally (index.js) and behind a Netlify Function
// in production (client/netlify/functions/api.mjs).
//
// A store must provide: kind, createTeam(name), getTeam(id), saveTeam(team),
// listTeams(), resetAll(). All methods may be async.
import { EVENT, publicEvent } from './data.js'
import { publicTeam, leaderboard } from './team.js'

const reply = (status, body) => ({ status, body })

// Short, user-visible description of a thrown error (prototype: we prefer a
// readable cause over a generic message).
export function describeError(e) {
  const name = e?.name && e.name !== 'Error' ? `${e.name}: ` : ''
  return `${name}${e?.message || String(e)}`.slice(0, 400)
}
const ok = (body) => reply(200, body)
const unauthorized = () => reply(401, { error: 'Okänt lag eller ogiltig session. Anslut igen.' })

function checkpointById(id) {
  return EVENT.checkpoints.find((c) => c.id === Number(id)) || null
}

// Accepts "/api/join", "/.netlify/functions/api/join" or a mount-relative
// "/join" and returns "/join".
export function normalizePath(path) {
  let p = String(path || '/')
  p = p.replace(/^.*?\/api(?=\/|$)/, '')
  p = p.replace(/\/+$/, '')
  return p || '/'
}

export function createGame(store) {
  async function requireTeam(query, body) {
    const teamId = body.teamId ?? query.teamId
    const token = body.token ?? query.token
    if (!teamId || !token) return null
    const team = await store.getTeam(String(teamId))
    if (!team || team.token !== token) return null
    return team
  }

  async function handle({ method = 'GET', path = '/', query = {}, body = {} } = {}) {
    const m = String(method).toUpperCase()
    const p = normalizePath(path)
    query = query && typeof query === 'object' ? query : {}
    body = body && typeof body === 'object' ? body : {}
    let match

    if (m === 'GET' && p === '/event') {
      return ok({ ...publicEvent(), storage: store.kind, storageDetail: store.describe ? store.describe() : null })
    }

    // Diagnostics: round-trips the store so a deploy can be checked from a browser.
    if (m === 'GET' && p === '/health') {
      const storage = store.describe ? store.describe() : { kind: store.kind }
      let checks = null
      let error = null
      if (store.selfTest) {
        try {
          checks = await store.selfTest()
        } catch (e) {
          error = describeError(e)
        }
      }
      return reply(error ? 500 : 200, { ok: !error, storage, checks, error, time: new Date().toISOString() })
    }

    // One call per poll: the caller's team plus the leaderboard.
    if (m === 'GET' && p === '/sync') {
      const team = await requireTeam(query, body)
      if (!team) return unauthorized()
      return ok({ team: publicTeam(team), teams: leaderboard(await store.listTeams()) })
    }

    if (m === 'POST' && p === '/join') {
      const { code, teamName, teamId, token } = body

      // Rejoin: client already holds a team session, just confirm it's still live.
      if (teamId && token) {
        const existing = await store.getTeam(String(teamId))
        if (existing && existing.token === token) {
          return ok({ team: publicTeam(existing), token: existing.token })
        }
      }

      if (code === undefined || code === null || String(code).trim().toUpperCase() !== EVENT.code) {
        return reply(400, { error: 'Fel eventkod. Kontrollera koden och försök igen.' })
      }
      if (!teamName || !String(teamName).trim()) {
        return reply(400, { error: 'Ange ett lagnamn för att fortsätta.' })
      }

      const team = await store.createTeam(String(teamName))
      return ok({ team: publicTeam(team), token: team.token })
    }

    if (m === 'GET' && (match = p.match(/^\/teams\/([^/]+)$/))) {
      const team = await store.getTeam(match[1])
      if (!team || !query.token || team.token !== query.token) {
        return reply(401, { error: 'Sessionen har gått ut.' })
      }
      return ok({ team: publicTeam(team) })
    }

    if (m === 'GET' && p === '/leaderboard') {
      return ok({ teams: leaderboard(await store.listTeams()) })
    }

    if (m === 'POST' && (match = p.match(/^\/checkpoints\/([^/]+)\/attempt$/))) {
      const team = await requireTeam(query, body)
      if (!team) return unauthorized()
      const cp = checkpointById(match[1])
      if (!cp) return reply(404, { error: 'Okänd hållplats.' })

      const existing = team.progress[cp.id]
      if (existing && existing.status === 'found') {
        return ok({ result: 'already-found', team: publicTeam(team) })
      }

      let status = 'missed'
      let points = 0
      let detail = {}

      if (cp.type === 'quiz') {
        const correct = Number(body.answerIndex) === cp.correctIndex
        status = correct ? 'found' : 'missed'
        points = correct ? cp.points : 0
        detail = { answerIndex: Number(body.answerIndex), correctIndex: cp.correctIndex }
      } else if (cp.type === 'photo') {
        status = body.hasPhoto ? 'found' : 'missed'
        points = body.hasPhoto ? cp.points : 0
      } else if (cp.type === 'clue') {
        const correct =
          typeof body.code === 'string' && body.code.trim().toUpperCase() === cp.code.toUpperCase()
        status = correct ? 'found' : 'missed'
        points = correct ? cp.points : 0
        detail = { correct }
      }

      team.progress[cp.id] = {
        status,
        points,
        submittedAt: Date.now(),
        attempts: (existing?.attempts || 0) + 1,
        ...detail,
      }
      await store.saveTeam(team)
      return ok({ result: status, pointsAwarded: points, team: publicTeam(team) })
    }

    if (m === 'POST' && (match = p.match(/^\/checkpoints\/([^/]+)\/skip$/))) {
      const team = await requireTeam(query, body)
      if (!team) return unauthorized()
      const cp = checkpointById(match[1])
      if (!cp) return reply(404, { error: 'Okänd hållplats.' })

      const existing = team.progress[cp.id]
      if (existing && existing.status === 'found') {
        return ok({ result: 'already-found', team: publicTeam(team) })
      }

      team.progress[cp.id] = {
        status: 'missed',
        points: 0,
        submittedAt: Date.now(),
        attempts: (existing?.attempts || 0) + 1,
        skipped: true,
      }
      await store.saveTeam(team)
      return ok({ result: 'missed', team: publicTeam(team) })
    }

    // Demo convenience: lets the settings sheet reset the whole event for a fresh run.
    if (m === 'POST' && p === '/admin/reset') {
      await store.resetAll()
      return ok({ ok: true })
    }

    return reply(404, { error: 'Okänd väg.' })
  }

  return { handle, store }
}
