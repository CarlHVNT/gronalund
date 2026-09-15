// Local / standalone API server (used by `npm run dev` and by a Render deploy).
// The routes themselves live in game.js so the Netlify Function can share them.
import express from 'express'
import cors from 'cors'
import { createGame } from './game.js'
import { createMemoryStore } from './stores/memory.js'

const PORT = process.env.PORT || 4000
const game = createGame(createMemoryStore())

const app = express()
app.use(cors())
app.use(express.json({ limit: '6mb' })) // generous enough for a mocked photo data URL

app.use('/api', async (req, res) => {
  try {
    const { status, body } = await game.handle({
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    })
    res.status(status).json(body)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Serverfel. Försök igen.' })
  }
})

// Malformed JSON bodies and the like: answer with JSON, never an HTML error page.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.status ? 'Ogiltigt anrop.' : 'Serverfel. Försök igen.' })
})

app.listen(PORT, () => {
  console.log(`ReadySet x Gröna Lund demo API listening on http://localhost:${PORT}`)
})
