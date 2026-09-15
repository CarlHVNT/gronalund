const crypto = require('crypto')
const { EVENT } = require('./data')

// In-memory demo store — resets when the server restarts. That's enough to
// simulate multiple teams/devices sharing one live event during a demo.
const teams = new Map() // teamId -> team

function makeId() {
  return crypto.randomBytes(6).toString('hex')
}

function makeToken() {
  return crypto.randomBytes(16).toString('hex')
}

function scoreOf(team) {
  return Object.values(team.progress).reduce((sum, p) => sum + (p.points || 0), 0)
}

function foundCountOf(team) {
  return Object.values(team.progress).filter((p) => p.status === 'found').length
}

function createTeam(name) {
  const id = makeId()
  const team = {
    id,
    token: makeToken(),
    name: name.trim().slice(0, 40) || 'Namnlöst lag',
    joinedAt: Date.now(),
    progress: {}, // checkpointId -> { status, points, answerIndex?, submittedAt }
  }
  teams.set(id, team)
  return team
}

function getTeam(id) {
  return teams.get(id) || null
}

function findTeamByToken(id, token) {
  const team = getTeam(id)
  if (!team || team.token !== token) return null
  return team
}

function publicTeam(team) {
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

function leaderboard() {
  return [...teams.values()]
    .map(publicTeam)
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
    .map((t, i) => ({ ...t, rank: i + 1 }))
}

function resetAll() {
  teams.clear()
}

module.exports = {
  createTeam,
  getTeam,
  findTeamByToken,
  publicTeam,
  leaderboard,
  resetAll,
  scoreOf,
  foundCountOf,
}
