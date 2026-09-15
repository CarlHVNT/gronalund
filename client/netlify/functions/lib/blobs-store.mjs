// Team store backed by Netlify Blobs, so every Netlify Function instance sees
// the same teams and the leaderboard is shared across devices.
import { getStore } from '@netlify/blobs'
import { newTeam } from '../../../../server/team.js'

const PREFIX = 'teams/'

export function createBlobsStore() {
  // getStore throws synchronously when the Blobs environment is missing,
  // which lets api.mjs fall back to in-memory state.
  const store = getStore({ name: 'gronalund', consistency: 'strong' })
  const keyFor = (id) => `${PREFIX}${id}`

  async function listKeys() {
    const { blobs } = await store.list({ prefix: PREFIX })
    return blobs.map((b) => b.key)
  }

  return {
    kind: 'blobs',
    async createTeam(name) {
      const team = newTeam(name)
      await store.setJSON(keyFor(team.id), team)
      return team
    },
    async getTeam(id) {
      if (!id) return null
      const team = await store.get(keyFor(id), { type: 'json' })
      return team ?? null
    },
    async saveTeam(team) {
      await store.setJSON(keyFor(team.id), team)
    },
    async listTeams() {
      const keys = await listKeys()
      const teams = await Promise.all(keys.map((k) => store.get(k, { type: 'json' })))
      return teams.filter(Boolean)
    },
    async resetAll() {
      const keys = await listKeys()
      await Promise.all(keys.map((k) => store.delete(k)))
    },
  }
}
