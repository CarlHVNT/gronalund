const express = require('express')
const cors = require('cors')
const { EVENT, publicEvent } = require('./data')
const store = require('./store')

const app = express()
app.use(cors())
app.use(express.json({ limit: '6mb' })) // generous enough for a mocked photo data URL

const PORT = process.env.PORT || 4000

function checkpointById(id) {
  return EVENT.checkpoints.find((c) => c.id === Number(id)) || null
}

function requireTeam(req, res) {
  const { teamId, token } = { ...req.query, ...req.body }
  const team = store.findTeamByToken(teamId, token)
  if (!team) {
    res.status(401).json({ error: 'Okänt lag eller ogiltig session. Anslut igen.' })
    return null
  }
  return team
}

app.get('/api/event', (req, res) => {
  res.json(publicEvent())
})

app.post('/api/join', (req, res) => {
  const { code, teamName, teamId, token } = req.body || {}

  // Rejoin: client already holds a team session, just confirm it's still live.
  if (teamId && token) {
    const existing = store.findTeamByToken(teamId, token)
    if (existing) return res.json({ team: store.publicTeam(existing), token: existing.token })
  }

  if (!code || code.trim().toUpperCase() !== EVENT.code) {
    return res.status(400).json({ error: 'Fel eventkod. Kontrollera koden och försök igen.' })
  }
  if (!teamName || !teamName.trim()) {
    return res.status(400).json({ error: 'Ange ett lagnamn för att fortsätta.' })
  }

  const team = store.createTeam(teamName)
  res.json({ team: store.publicTeam(team), token: team.token })
})

app.get('/api/teams/:id', (req, res) => {
  const team = store.findTeamByToken(req.params.id, req.query.token)
  if (!team) return res.status(401).json({ error: 'Sessionen har gått ut.' })
  res.json({ team: store.publicTeam(team) })
})

app.get('/api/leaderboard', (req, res) => {
  res.json({ teams: store.leaderboard() })
})

app.post('/api/checkpoints/:id/attempt', (req, res) => {
  const team = requireTeam(req, res)
  if (!team) return

  const cp = checkpointById(req.params.id)
  if (!cp) return res.status(404).json({ error: 'Okänd hållplats.' })

  const existing = team.progress[cp.id]
  if (existing && existing.status === 'found') {
    return res.json({ result: 'already-found', team: store.publicTeam(team) })
  }

  let status = 'missed'
  let points = 0
  let detail = {}

  if (cp.type === 'quiz') {
    const { answerIndex } = req.body
    const correct = Number(answerIndex) === cp.correctIndex
    status = correct ? 'found' : 'missed'
    points = correct ? cp.points : 0
    detail = { answerIndex: Number(answerIndex), correctIndex: cp.correctIndex }
  } else if (cp.type === 'photo') {
    const { hasPhoto } = req.body
    status = hasPhoto ? 'found' : 'missed'
    points = hasPhoto ? cp.points : 0
  } else if (cp.type === 'clue') {
    const { code } = req.body
    const correct = typeof code === 'string' && code.trim().toUpperCase() === cp.code.toUpperCase()
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

  res.json({ result: status, pointsAwarded: points, team: store.publicTeam(team) })
})

app.post('/api/checkpoints/:id/skip', (req, res) => {
  const team = requireTeam(req, res)
  if (!team) return
  const cp = checkpointById(req.params.id)
  if (!cp) return res.status(404).json({ error: 'Okänd hållplats.' })

  const existing = team.progress[cp.id]
  if (existing && existing.status === 'found') {
    return res.json({ result: 'already-found', team: store.publicTeam(team) })
  }

  team.progress[cp.id] = {
    status: 'missed',
    points: 0,
    submittedAt: Date.now(),
    attempts: (existing?.attempts || 0) + 1,
    skipped: true,
  }
  res.json({ result: 'missed', team: store.publicTeam(team) })
})

// Demo convenience — lets the settings sheet reset the whole event for a fresh run.
app.post('/api/admin/reset', (req, res) => {
  store.resetAll()
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`ReadySet x Gröna Lund demo API listening on http://localhost:${PORT}`)
})
