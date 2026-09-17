// Team store backed by Netlify Blobs, so every Netlify Function instance sees
// the same teams and the leaderboard is shared across devices.
//
// Consistency: the store itself is created with the default (eventual) mode so
// writes and list() never trip the strong-consistency check. Reads ask for
// strong consistency per call, which needs the runtime to provide an uncached
// edge URL; if it does not, the first failing read flips the store to eventual
// reads for the life of this instance instead of taking every request down.
import { getStore } from '@netlify/blobs'
import { newTeam } from '../../../../server/team.js'

const PREFIX = 'teams/'
const HEALTH_PREFIX = 'health/'
const LEADERBOARD_TTL_MS = 3000

export function createBlobsStore({ getStore: getStoreImpl = getStore, name = 'gronalund' } = {}) {
  // Throws synchronously when the Blobs environment is missing, which lets
  // api.mjs fall back to in-memory state.
  const store = getStoreImpl({ name })
  const keyFor = (id) => `${PREFIX}${id}`
  let strongReads = true
  let leaderboardCache = null // { at, teams }

  function isConsistencyError(e) {
    return e?.name === 'BlobsConsistencyError' || /strong consistency/i.test(e?.message || '')
  }

  async function readJson(key) {
    if (strongReads) {
      try {
        return await store.get(key, { type: 'json', consistency: 'strong' })
      } catch (e) {
        if (!isConsistencyError(e)) throw e
        console.warn('Netlify Blobs: strong reads unavailable here, using eventual consistency:', e.message)
        strongReads = false
      }
    }
    return store.get(key, { type: 'json' })
  }

  async function listKeys(prefix) {
    const { blobs } = await store.list({ prefix })
    return blobs.map((b) => b.key)
  }

  function invalidate() {
    leaderboardCache = null
  }

  return {
    kind: 'blobs',
    describe() {
      return { kind: 'blobs', consistency: strongReads ? 'strong' : 'eventual', store: name }
    },
    async createTeam(teamName) {
      const team = newTeam(teamName)
      await store.setJSON(keyFor(team.id), team)
      invalidate()
      return team
    },
    async getTeam(id) {
      if (!id) return null
      const team = await readJson(keyFor(id))
      return team ?? null
    },
    async saveTeam(team) {
      await store.setJSON(keyFor(team.id), team)
      invalidate()
    },
    // Every phone polls this a few times a minute, so one instance reads the
    // team blobs at most once per TTL and serves everyone from that snapshot.
    async listTeams() {
      if (leaderboardCache && Date.now() - leaderboardCache.at < LEADERBOARD_TTL_MS) return leaderboardCache.teams
      const keys = await listKeys(PREFIX)
      const teams = (await Promise.all(keys.map((k) => readJson(k)))).filter(Boolean)
      leaderboardCache = { at: Date.now(), teams }
      return teams
    },
    async resetAll() {
      const keys = await listKeys(PREFIX)
      await Promise.all(keys.map((k) => store.delete(k)))
      invalidate()
    },
    // Round-trips a probe blob so /api/health can show whether Blobs works
    // from this deploy, and how long each step takes.
    async selfTest() {
      const key = `${HEALTH_PREFIX}${Date.now().toString(36)}`
      const checks = {}
      const timed = async (label, fn) => {
        const t = Date.now()
        const result = await fn()
        checks[label] = Date.now() - t
        return result
      }
      await timed('writeMs', () => store.setJSON(key, { ok: true }))
      const back = await timed('readMs', () => readJson(key))
      await timed('listMs', () => listKeys(HEALTH_PREFIX))
      await timed('deleteMs', () => store.delete(key))
      if (!back || back.ok !== true) throw new Error('Probe blob could not be read back after writing it.')
      return { ...checks, consistency: strongReads ? 'strong' : 'eventual' }
    },
  }
}
