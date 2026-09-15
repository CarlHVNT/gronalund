// Where the API lives.
//
// - Dev: relative /api, which Vite proxies to the local Express server
//   (see vite.config.js).
// - Netlify: relative /api, served by the Netlify Function in
//   netlify/functions/api.mjs on the same origin. No configuration needed.
// - Separate server (e.g. Render): set VITE_API_URL to its origin at build
//   time and requests become absolute.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
export const API_BASE = `${API_ORIGIN}/api`

// Human-readable description of where requests go, for error messages.
function describeTarget() {
  return API_ORIGIN || window.location.origin
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  let res
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch (e) {
    // Network-level failure: server down or sleeping, wrong address, CORS block.
    throw new Error(
      `Kunde inte nå spelservern på ${describeTarget()}. Kontrollera att servern är igång. (${e.message})`,
    )
  }

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    // Not JSON, almost always an HTML page: the request hit a static host
    // (e.g. Netlify's index.html fallback) instead of the API server.
    throw new Error(
      `Spelservern svarade inte med JSON (HTTP ${res.status} från ${url}). ` +
        'Kontrollera att API:et är utrullat (Netlify Functions) eller att VITE_API_URL pekar rätt.',
    )
  }

  if (!res.ok) {
    throw new Error(data.error || `Något gick fel (HTTP ${res.status}). Försök igen.`)
  }
  return data
}

export const api = {
  getEvent: () => request('/event'),
  join: (body) => request('/join', { method: 'POST', body: JSON.stringify(body) }),
  getTeam: (teamId, token) => request(`/teams/${teamId}?token=${encodeURIComponent(token)}`),
  getLeaderboard: () => request('/leaderboard'),
  attempt: (checkpointId, body) =>
    request(`/checkpoints/${checkpointId}/attempt`, { method: 'POST', body: JSON.stringify(body) }),
  skip: (checkpointId, body) =>
    request(`/checkpoints/${checkpointId}/skip`, { method: 'POST', body: JSON.stringify(body) }),
  resetDemo: () => request('/admin/reset', { method: 'POST' }),
}
