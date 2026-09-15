// Team helpers shared by every store and by the request handler in game.js.
import crypto from 'node:crypto'
import { EVENT } from './data.js'

export function newTeam(name) {
  return {
    id: crypto.randomBytes(6).toString('hex'),
    token: crypto.randomBytes(16).toString('hex'),
    name: String(name).trim().slice(0, 40) || 'Namnlöst lag',
    joinedAt: Date.now(),
    progress: {}, // checkpointId -> { status, points, answerIndex?, submittedAt }
  }
}

export function scoreOf(team) {
  return Object.values(team.progress).reduce((sum, p) => sum + (p.points || 0), 0)
}

export function foundCountOf(team) {
  return Object.values(team.progress).filter((p) => p.status === 'found').length
}

export function publicTeam(team) {
  return {
    id: team.id,
    name: team.name,
    joinedAt: team.joinedAt,
    score: scoreOf(team),
    foundCount: foundCountOf(team),
    total: EVENT.checkpoints.length,
    progress: team.progress,
  }
}

export function leaderboard(teams) {
  return teams
    .map(publicTeam)
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
    .map((t, i) => ({ ...t, rank: i + 1 }))
}
