// In dev, Vite proxies relative /api requests to the local server (see
// vite.config.js). In production (e.g. a Netlify static deploy), the API
// runs on a separate host — set VITE_API_URL to that host's origin at
// build time and requests become absolute.
const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''
const BASE = `${API_ORIGIN}/api`

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Något gick fel. Försök igen.')
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
