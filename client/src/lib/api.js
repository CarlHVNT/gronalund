// Where the API lives.
//
// - In dev, requests go to a relative /api path and Vite proxies them to the
//   local server (see vite.config.js).
// - In production (e.g. the Netlify static deploy) the API runs on a separate
//   host. Set VITE_API_URL to that host's origin at build time. If it is not
//   set, fall back to the Render service name from server/render.yaml so a
//   default deploy works without extra configuration.
const DEFAULT_PROD_API_URL = 'https://gronalund-server.onrender.com'

function resolveOrigin() {
  const configured = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
  if (configured) return configured
  return import.meta.env.PROD ? DEFAULT_PROD_API_URL : ''
}

const API_ORIGIN = resolveOrigin()
export const API_BASE = `${API_ORIGIN}/api`

// Human-readable description of where requests go, for error messages.
function describeTarget() {
  return API_ORIGIN || `${window.location.origin} (via Vite-proxyn till servern på :4000)`
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
        'Om appen är publicerad på Netlify: sätt VITE_API_URL till serverns adress och bygg om.',
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
