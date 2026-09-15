// In-memory store: state lives as long as the process does. Enough for local
// dev and for one long-running server (e.g. Render). Netlify uses the Blobs
// store in client/netlify/functions/lib/blobs-store.mjs instead.
import { newTeam } from '../team.js'

export function createMemoryStore() {
  const teams = new Map() // teamId -> team

  return {
    kind: 'memory',
    async createTeam(name) {
      const team = newTeam(name)
      teams.set(team.id, team)
      return team
    },
    async getTeam(id) {
      return teams.get(id) || null
    },
    async saveTeam(team) {
      teams.set(team.id, team)
    },
    async listTeams() {
      return [...teams.values()]
    },
    async resetAll() {
      teams.clear()
    },
  }
}
